"""
routers/admin.py
----------------
Admin-only data endpoints.

Frontend pages:
  AdminFraudDetectionPage → GET  /api/fraud-flags
  AdminOccasionsPage      → GET  /api/campaigns
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/api", tags=["Admin"])


# ── GET /api/fraud-flags  (AdminFraudDetectionPage) ──────────────────────────

@router.get("/fraud-flags")
def get_fraud_flags(db: Session = Depends(get_db)):
    """
    Returns fraud flags joined with user and transaction data
    via the vw_fraud_dashboard view.
    Maps the 'reviewed_by_name' to a boolean 'reviewed' for the frontend.
    """
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
def get_campaigns(db: Session = Depends(get_db)):
    """
    Returns occasion cashback campaigns.
    Maps DB column names to the frontend's CashbackCampaign interface:
      occasion_name   → name / title
      cashback_pct    → percentage_back / percent
      max_cashback    → max_limit_bdt / max_limit
    """
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
