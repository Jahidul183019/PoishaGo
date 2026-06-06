"""
routers/admin.py
----------------
Admin-only data endpoints.

Frontend pages:
  AdminFraudDetectionPage → GET  /api/fraud-flags
  AdminOccasionsPage      → GET  /api/campaigns
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_admin, require_permission
from pydantic import BaseModel

class CampaignRequest(BaseModel):
    name: str
    type: str
    percent: float
    max_limit: float
    min_txn_amount: float
    eligible_txn_type: str
    start_date: str
    end_date: str

class BalanceAdjustmentRequest(BaseModel):
    amount: float
    type: str # 'credit' | 'debit'

router = APIRouter(prefix="/api", tags=["Admin"])


# ── GET /api/fraud-flags  (AdminFraudDetectionPage) ──────────────────────────

@router.get("/fraud-flags")
def get_fraud_flags(
    admin: dict = Depends(require_permission("REVIEW_FRAUD")), 
    db: Session = Depends(get_db)
):
    """Returns fraud flags joined with user and transaction data."""
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    flag_id,
                    reference_no        AS txn_id,
                    flagged_user        AS user_name,
                    phone,
                    rule_triggered,
                    risk_score,
                    (reviewed_by_name IS NOT NULL) AS reviewed,
                    flagged_at
                FROM vw_fraud_dashboard
                ORDER BY flagged_at DESC
            """)
        ).mappings().all()

    return [
        {
            "flag_id":       r["flag_id"],
            "txn_id":        r["txn_id"],
            "user_name":     r["user_name"],
            "phone":         r["phone"],
            "rule_triggered": r["rule_triggered"],
            "risk_score":    r["risk_score"],
            "reviewed":      bool(r["reviewed"]),
            "flagged_at":    r["flagged_at"].isoformat(),
        }
        for r in rows
    ]


# ── GET /api/campaigns  (AdminOccasionsPage) ─────────────────────────────────

@router.get("/campaigns")
def get_campaigns(
    admin: dict = Depends(require_permission("MANAGE_CAMPAIGNS")), 
    db: Session = Depends(get_db)
):
    """Returns occasion cashback campaigns."""
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    occasion_id                              AS id,
                    occasion_name                           AS name,
                    occasion_type                           AS type,
                    cashback_pct                            AS percent,
                    max_cashback                            AS max_limit,
                    max_cashback                            AS max_limit_bdt,
                    min_txn_amount,
                    is_active,
                    to_char(end_date, 'YYYY-MM-DD')         AS end_date,
                    to_char(created_at, 'YYYY-MM-DD')       AS created_at
                FROM occasion_cashbacks
                ORDER BY created_at DESC
            """)
        ).mappings().all()

    return [
        {
            "id":              r["id"],
            "name":            r["name"],
            "title":           r["name"],      # alias for AdminOccasionsPage
            "type":            r["type"],
            "percent":         float(r["percent"]),
            "percentage_back": float(r["percent"]),
            "max_limit":       float(r["max_limit"]),
            "max_limit_bdt":   float(r["max_limit_bdt"]),
            "min_txn_amount":  float(r["min_txn_amount"]),
            "is_active":       r["is_active"],
            "end_date":        r["end_date"],
            "valid_until":     r["end_date"],  # alias
            "created_at":      r["created_at"],
        }
        for r in rows
    ]

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int, 
    admin: dict = Depends(require_permission("TOGGLE_USER_STATUS")), 
    db: Session = Depends(get_db)
):
    """Blocks or restores a user's wallet access."""
    with db.connection().engine.connect() as conn:
        res = conn.execute(
            text("SELECT is_active FROM wallets WHERE user_id = :uid"),
            {"uid": user_id}
        ).first()
        if not res:
            raise HTTPException(404, "User wallet not found")
        
        new_status = not res[0]
        conn.execute(
            text("UPDATE wallets SET is_active = :status WHERE user_id = :uid"),
            {"uid": user_id, "status": new_status}
        )
        
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id, new_value)
                VALUES (:aid, 'TOGGLE_WALLET_STATUS', 'wallets', :uid, :val)
            """),
            {"aid": admin["admin_id"], "uid": user_id, "val": f'{{"is_active": {str(new_status).lower()}}}'}
        )
        conn.commit()
    return {"message": "Wallet status updated", "is_active": new_status}

@router.post("/users/{user_id}/adjust-balance")
def adjust_user_balance(
    user_id: int,
    req: BalanceAdjustmentRequest,
    admin: dict = Depends(require_permission("ADJUST_BALANCE")),
    db: Session = Depends(get_db)
):
    """Administratively adjust a user's balance and log the audit trail."""
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    with db.connection().engine.connect() as conn:
        # Get current balance
        wallet = conn.execute(
            text("SELECT wallet_id, balance FROM wallets WHERE user_id = :uid"),
            {"uid": user_id}
        ).first()
        if not wallet:
            raise HTTPException(404, "User wallet not found")
        
        old_balance = float(wallet[1])
        if req.type == 'debit' and old_balance < req.amount:
            raise HTTPException(400, "Insufficient user balance for debit correction")

        new_balance = old_balance + req.amount if req.type == 'credit' else old_balance - req.amount
        
        # Update balance
        conn.execute(
            text("UPDATE wallets SET balance = :nb WHERE wallet_id = :wid"),
            {"nb": new_balance, "wid": wallet[0]}
        )

        # Log to audit trail
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id, old_value, new_value)
                VALUES (:aid, 'ADJUST_BALANCE', 'wallets', :wid, :old, :new)
            """),
            {
                "aid": admin["admin_id"], "wid": wallet[0],
                "old": f'{{"balance": {old_balance}}}',
                "new": f'{{"balance": {new_balance}}}'
            }
        )
        conn.commit()
    return {"message": "Balance adjusted", "new_balance": new_balance}

@router.post("/fraud-flags/{flag_id}/resolve")
def resolve_fraud_flag(
    flag_id: int, 
    admin: dict = Depends(require_permission("REVIEW_FRAUD")), 
    db: Session = Depends(get_db)
):
    """Marks a suspicious activity flag as reviewed."""
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("UPDATE fraud_flags SET reviewed_by = :aid WHERE flag_id = :fid"),
            {"aid": admin["admin_id"], "fid": flag_id}
        )
        
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id)
                VALUES (:aid, 'RESOLVE_FRAUD_FLAG', 'fraud_flags', :fid)
            """),
            {"aid": admin["admin_id"], "fid": flag_id}
        )
        conn.commit()
    return {"message": "Fraud alert resolved"}

@router.post("/campaigns")
def create_campaign(
    req: CampaignRequest,
    admin: dict = Depends(require_permission("MANAGE_CAMPAIGNS")),
    db: Session = Depends(get_db),
):
    """Creates a new cashback campaign and logs the action."""
    with db.connection().engine.connect() as conn:
        res = conn.execute(
            text("""
                INSERT INTO occasion_cashbacks (
                    occasion_name, occasion_type, cashback_pct, max_cashback,
                    min_txn_amount, eligible_txn_type, start_date, end_date,
                    is_active, created_by
                )
                VALUES (
                    :name, :type, :pct, :max_c, :min_a, :txn_t, :s_date, :e_date,
                    true, :admin_id
                )
                RETURNING occasion_id
            """),
            {
                "name": req.name, "type": req.type, "pct": req.percent,
                "max_c": req.max_limit, "min_a": req.min_txn_amount,
                "txn_t": req.eligible_txn_type, "s_date": req.start_date,
                "e_date": req.end_date, "admin_id": admin["admin_id"]
            },
        )
        row = res.first()
        occ_id = row[0]

        # Audit log insertion
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id, new_value)
                VALUES (:aid, 'CREATE_CAMPAIGN', 'occasion_cashbacks', :tid, :val)
            """),
            {
                "aid": admin["admin_id"], "tid": occ_id,
                "val": req.model_dump_json()
            }
        )
        conn.commit()

    return {"message": "Campaign created", "id": occ_id}

@router.delete("/campaigns/{occasion_id}")
def delete_campaign(
    occasion_id: int,
    admin: dict = Depends(require_permission("MANAGE_CAMPAIGNS")),
    db: Session = Depends(get_db)
):
    """Permanently removes a campaign and logs the action."""
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM occasion_cashbacks WHERE occasion_id = :oid"),
            {"oid": occasion_id}
        )
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id)
                VALUES (:aid, 'DELETE_CAMPAIGN', 'occasion_cashbacks', :tid)
            """),
            {"aid": admin["admin_id"], "tid": occasion_id}
        )
        conn.commit()
    return {"message": "Campaign deleted"}

@router.post("/campaigns/{occasion_id}/toggle")
def toggle_campaign(
    occasion_id: int,
    admin: dict = Depends(require_permission("MANAGE_CAMPAIGNS")),
    db: Session = Depends(get_db)
):
    """Toggles the active status of a campaign."""
    with db.connection().engine.connect() as conn:
        res = conn.execute(
            text("SELECT is_active FROM occasion_cashbacks WHERE occasion_id = :oid"),
            {"oid": occasion_id}
        ).first()
        if not res:
            raise HTTPException(404, "Campaign not found")
        
        new_status = not res[0]
        conn.execute(
            text("UPDATE occasion_cashbacks SET is_active = :status WHERE occasion_id = :oid"),
            {"oid": occasion_id, "status": new_status}
        )
        conn.execute(
            text("""
                INSERT INTO audit_logs (admin_id, action, target_table, target_id, new_value)
                VALUES (:aid, 'TOGGLE_CAMPAIGN', 'occasion_cashbacks', :tid, :val)
            """),
            {"aid": admin["admin_id"], "tid": occasion_id, "val": f'{{"is_active": {str(new_status).lower()}}}'}
        )
        conn.commit()
    return {"message": "Campaign status updated", "is_active": new_status}
