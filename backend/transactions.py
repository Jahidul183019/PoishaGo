"""
routers/transactions.py
-----------------------
All money-movement endpoints.

Frontend pages:
  SendMoneyPage          → POST /api/transactions/send
  CashOutPage            → POST /api/transactions/cashout
  CashInPage             → POST /api/transactions/cashin
  BillPaymentPage        → POST /api/transactions/bill
  MobileRechargePage     → POST /api/recharge
  TransactionHistoryPage → GET  /api/transactions
  AdminDashboardPage     → GET  /api/admin/transactions
  AdminDashboardPage     → GET  /api/admin/revenue-trend
"""

import random
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_admin, require_permission
from security import verify_pin
from auth_otp import send_otp_email

router = APIRouter(prefix="/api", tags=["Transactions"])


# ── Pydantic request models ───────────────────────────────────────────────────

class SendMoneyRequest(BaseModel):
    receiver_phone: str
    amount: float
    pin: str
    otp: str
    reference_note: str | None = None

class CashInOutRequest(BaseModel):
    agent_phone: str
    amount: float
    pin: str
    otp: str = None

class SendCashInOTPRequest(BaseModel):
    agent_phone: str

class BillPaymentRequest(BaseModel):
    biller_name: str
    account_number: str
    amount: float
    pin: str
    otp: str

class RechargeRequest(BaseModel):
    phone: str
    operator: str
    amount: float
    pin: str


# ── Config endpoints ────────────────────────────────────────────────────────────

@router.get("/transactions/fees")
def get_transaction_fees():
    """Returns the current transaction fee configuration."""
    return {
        "cashout_percentage": 0.015,
        "send_money_flat": 5.00,
        "cashin_flat": 0.00,
        "bill_payment_flat": 0.00,
        "mobile_recharge_flat": 0.00
    }

# ── Shared transaction helper ─────────────────────────────────────────────────

def _execute_transfer(
    conn,
    sender_user_id,
    sender_pin: str,
    amount: float,
    receiver_phone: str,
    txn_type: str,       # 'transfer' | 'cashout' | 'cashin' | 'bill'
) -> tuple[str, int, float, str]:
    sender_user_id = int(sender_user_id)
    if amount <= 0:
        raise HTTPException(400, "Amount must be greater than 0.")

    pw_row = conn.execute(
        text("SELECT password_hash FROM users WHERE user_id = :uid"),
        {"uid": sender_user_id},
    ).first()
    if not pw_row or not verify_pin(sender_pin, pw_row[0]):
        raise HTTPException(401, "Invalid PIN.")

    sender_wallet = conn.execute(
        text("SELECT wallet_id, balance FROM wallets WHERE user_id = :uid"),
        {"uid": sender_user_id},
    ).first()
    if not sender_wallet:
        raise HTTPException(400, "Sender wallet not found.")

    receiver_info = conn.execute(
        text("""
            SELECT u.user_id, w.wallet_id
            FROM users u
            LEFT JOIN wallets w ON u.user_id = w.user_id
            WHERE u.phone = :p
        """),
        {"p": receiver_phone},
    ).first()
    if not receiver_info:
        raise HTTPException(400, "Receiver not found.")
    if not receiver_info[1]:
        raise HTTPException(400, "Receiver account is unverified and cannot receive money.")

    sender_wallet_id   = sender_wallet[0]
    receiver_wallet_id = receiver_info[1]
    receiver_user_id   = receiver_info[0]

    fee = 0.0
    if txn_type == "cashout":
        fee = amount * 0.015
    elif txn_type == "transfer":
        is_favorite = conn.execute(
            text("""
                SELECT 1 FROM favorite_contacts 
                WHERE owner_user_id = :sender_id 
                  AND contact_user_id = :receiver_id
            """),
            {"sender_id": sender_user_id, "receiver_id": receiver_user_id}
        ).first()
        fee = 0.0 if is_favorite else 5.00
        
    total_deduction = amount + fee

    if sender_wallet[1] < total_deduction:
        raise HTTPException(400, "Insufficient funds to cover amount and fees.")

    conn.execute(
        text("UPDATE wallets SET balance = balance - :deduction WHERE wallet_id = :wid"),
        {"deduction": total_deduction, "wid": sender_wallet_id},
    )
    conn.execute(
        text("UPDATE wallets SET balance = balance + :amt WHERE wallet_id = :wid"),
        {"amt": amount, "wid": receiver_wallet_id},
    )

    if fee > 0:
        sys_wallet = conn.execute(
            text("SELECT wallet_id FROM wallets WHERE wallet_number = 'SYSTEM_REVENUE'")
        ).first()
        if not sys_wallet:
            sys_user = conn.execute(
                text("""
                    INSERT INTO users (full_name, phone, email, password_hash, user_type, is_verified)
                    VALUES ('System Revenue', 'SYSTEM_REVENUE',
                            'revenue@poishagoapp.internal', 'SYSTEM_HASH', 'personal', true)
                    ON CONFLICT (phone) DO NOTHING
                    RETURNING user_id
                """)
            ).first()
            if sys_user:
                conn.execute(
                    text("""
                        INSERT INTO wallets (user_id, wallet_number, balance, is_active)
                        VALUES (:uid, 'SYSTEM_REVENUE', 0.00, true)
                        ON CONFLICT DO NOTHING
                    """),
                    {"uid": sys_user[0]},
                )
            sys_wallet = conn.execute(
                text("SELECT wallet_id FROM wallets WHERE wallet_number = 'SYSTEM_REVENUE'")
            ).first()
            
        if sys_wallet:
            conn.execute(
                text("UPDATE wallets SET balance = balance + :fee WHERE wallet_id = :wid"),
                {"fee": fee, "wid": sys_wallet[0]}
            )

    reward_row = conn.execute(
        text("SELECT current_points, tier FROM reward_points WHERE user_id = :uid FOR UPDATE"),
        {"uid": sender_user_id}
    ).first()

    if reward_row:
        curr_pts, curr_tier = reward_row[0], reward_row[1]
        rate = 0.1
        if curr_tier == "silver":     rate = 0.125
        elif curr_tier == "gold":     rate = 0.15
        elif curr_tier == "platinum": rate = 0.20

        earned  = int(amount * rate)
        new_pts = curr_pts + earned

        new_tier = "bronze"
        if new_pts >= 15000:  new_tier = "platinum"
        elif new_pts >= 5000: new_tier = "gold"
        elif new_pts >= 1000: new_tier = "silver"

        conn.execute(
            text("""
                UPDATE reward_points
                SET current_points = current_points + :earned,
                    lifetime_earned = lifetime_earned + :earned,
                    tier = CAST(:ntier AS VARCHAR),
                    updated_at = now(),
                    tier_updated_at = CASE WHEN tier <> CAST(:ntier AS VARCHAR) THEN now() ELSE tier_updated_at END
                WHERE user_id = :uid
            """),
            {"earned": earned, "ntier": str(new_tier), "uid": sender_user_id}
        )

    campaign = conn.execute(
        text("""
            SELECT cashback_pct, max_cashback, min_txn_amount, occasion_name
            FROM occasion_cashbacks
            WHERE is_active = true
              AND CURRENT_DATE BETWEEN start_date AND end_date
              AND (eligible_txn_type = 'all' OR eligible_txn_type = :ttype)
              AND :amt >= min_txn_amount
            ORDER BY cashback_pct DESC
            LIMIT 1
        """),
        {"ttype": txn_type, "amt": amount}
    ).mappings().first()

    cashback_applied = 0.0
    campaign_name = None
    if campaign:
        pct   = float(campaign["cashback_pct"])
        limit = float(campaign["max_cashback"])

        calc_cashback    = (amount * pct) / 100.0
        cashback_applied = min(calc_cashback, limit)

        if cashback_applied > 0:
            campaign_name = campaign["occasion_name"]
            conn.execute(
                text("UPDATE wallets SET balance = balance + :cb WHERE wallet_id = :wid"),
                {"cb": cashback_applied, "wid": sender_wallet_id}
            )
            conn.execute(
                text("""
                    INSERT INTO notifications (user_id, message, notif_type)
                    VALUES (:uid, :msg, 'in_app')
                """),
                {
                    "uid": sender_user_id,
                    "msg": f"Congratulations! You received \u09f3{cashback_applied:.2f} cashback from the '{campaign_name}' campaign."
                }
            )

    conn.execute(
        text("""
            UPDATE favorite_contacts
            SET total_txn = total_txn + 1
            WHERE (owner_user_id = :oid AND contact_user_id = :cid)
               OR (owner_user_id = :cid AND contact_user_id = :oid)
        """),
        {"oid": sender_user_id, "cid": receiver_user_id}
    )

    ref = f"TXN{int(datetime.now(timezone.utc).timestamp())}{random.randint(100, 999)}"
    res = conn.execute(
        text("""
            INSERT INTO transactions
                (reference_no, sender_wallet_id, receiver_wallet_id,
                 txn_type, amount, fee, status)
            VALUES (:ref, :sw, :rw, :ttype, :amt, :fee, 'success')
            RETURNING txn_id
        """),
        {
            "ref": ref, "sw": sender_wallet_id, "rw": receiver_wallet_id,
            "ttype": txn_type, "amt": amount, "fee": fee
        },
    )
    txn_id = res.first()[0]

    return ref, txn_id, cashback_applied, campaign_name


# ── POST /api/transactions/send/send-otp ─────────────────────────────────────

@router.post("/transactions/send/send-otp")
def send_money_otp(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        try:
            user_row = conn.execute(
                text("SELECT email FROM users WHERE user_id = :uid"),
                {"uid": uid_int},
            ).first()
            if not user_row or not user_row[0]:
                raise HTTPException(400, "No email configured for this account.")

            user_email = user_row[0].strip().lower()
            otp_code   = "".join(secrets.choice("0123456789") for _ in range(6))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

            conn.execute(
                text("""
                    INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                    VALUES (:uid, :otp, 'transfer', :exp, false)
                """),
                {"uid": uid_int, "otp": otp_code, "exp": expires_at},
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    send_otp_email(user_email, otp_code)
    return {"status": "success", "detail": "Send money OTP sent to your email."}


# ── POST /api/transactions/send  (SendMoneyPage) ─────────────────────────────

@router.post("/transactions/send")
def send_money(
    req: SendMoneyRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    otp_clean = req.otp.strip()

    with db.connection().engine.connect() as conn:
        try:
            otp_row = conn.execute(
                text("""
                    SELECT otp_id, expires_at, is_used
                    FROM otp_verifications
                    WHERE user_id = :uid
                      AND otp_code = :otp_code
                      AND purpose = 'transfer'
                      AND is_used = false
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"uid": uid_int, "otp_code": otp_clean},
            ).first()
            if not otp_row:
                raise HTTPException(400, "Invalid or missing OTP.")

            otp_id, db_expires, is_used = otp_row[0], otp_row[1], otp_row[2]
            now = datetime.now(timezone.utc)

            if isinstance(db_expires, str):
                from dateutil.parser import parse
                db_expires = parse(db_expires)

            if db_expires.tzinfo is None:
                db_expires = db_expires.replace(tzinfo=timezone.utc)

            if db_expires < now:
                raise HTTPException(400, "OTP is invalid or expired.")

            conn.execute(
                text("UPDATE otp_verifications SET is_used = true WHERE otp_id = :oid"),
                {"oid": otp_id},
            )

            ref, txn_id, cb_amt, cb_name = _execute_transfer(
                conn, uid_int, req.pin, req.amount, req.receiver_phone, "transfer"
            )

            if req.amount >= 40000:
                conn.execute(
                    text("""
                        INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score)
                        VALUES (:tid, :uid, :rule, :score)
                    """),
                    {"tid": txn_id, "uid": uid_int,
                     "rule": "Large Swift Transaction Flag (>= \u09f340,000)",
                     "score": random.randint(75, 95)}
                )

            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
    return {
        "message": "Transaction successful",
        "transaction_id": ref,
        "cashback_amount": cb_amt,
        "cashback_campaign": cb_name,
    }


# ── POST /api/transactions/cashout/send-otp  (CashOutPage) ───────────────────

@router.post("/transactions/cashout/send-otp")
def send_cashout_otp(
    req: SendCashInOTPRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        try:
            user_row = conn.execute(
                text("SELECT email FROM users WHERE user_id = :uid"),
                {"uid": uid_int},
            ).first()
            if not user_row or not user_row[0]:
                raise HTTPException(400, "No email configured for this account.")

            user_email = user_row[0].strip().lower()
            otp_code   = "".join(secrets.choice("0123456789") for _ in range(6))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

            conn.execute(
                text("""
                    INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                    VALUES (:uid, :otp, 'transfer', :exp, false)
                """),
                {"uid": uid_int, "otp": otp_code, "exp": expires_at},
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    send_otp_email(user_email, otp_code)
    return {"status": "success", "detail": "Cash-out OTP sent to your email."}


# ── POST /api/transactions/cashout  (CashOutPage) ────────────────────────────

@router.post("/transactions/cashout")
def cash_out(
    req: CashInOutRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    otp_clean = req.otp.strip()

    with db.connection().engine.connect() as conn:
        try:
            otp_row = conn.execute(
                text("""
                    SELECT otp_id, expires_at, is_used
                    FROM otp_verifications
                    WHERE user_id = :uid
                      AND otp_code = :otp_code
                      AND purpose = 'transfer'
                      AND is_used = false
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"uid": uid_int, "otp_code": otp_clean},
            ).first()
            if not otp_row:
                raise HTTPException(400, "Invalid or missing OTP.")

            otp_id, db_expires, is_used = otp_row[0], otp_row[1], otp_row[2]
            now = datetime.now(timezone.utc)

            if isinstance(db_expires, str):
                from dateutil.parser import parse
                db_expires = parse(db_expires)

            if db_expires.tzinfo is None:
                db_expires = db_expires.replace(tzinfo=timezone.utc)

            if db_expires < now:
                raise HTTPException(400, "OTP is invalid or expired.")

            conn.execute(
                text("UPDATE otp_verifications SET is_used = true WHERE otp_id = :oid"),
                {"oid": otp_id},
            )

            ref, txn_id, cb_amt, cb_name = _execute_transfer(
                conn, uid_int, req.pin, req.amount, req.agent_phone, "cashout"
            )

            if req.amount >= 40000:
                conn.execute(
                    text("""
                        INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score)
                        VALUES (:tid, :uid, :rule, :score)
                    """),
                    {"tid": txn_id, "uid": uid_int,
                     "rule": "Large Withdrawal Alert (>= \u09f340,000)",
                     "score": random.randint(80, 98)}
                )

            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
    return {
        "message": "Cash out successful",
        "transaction_id": ref,
        "cashback_amount": cb_amt,
        "cashback_campaign": cb_name,
    }


# ── POST /api/transactions/cashin/send-otp  (CashInPage) ─────────────────────

@router.post("/transactions/cashin/send-otp")
def send_cashin_otp(
    req: SendCashInOTPRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        try:
            agent_row = conn.execute(
                text("SELECT user_id, email FROM users WHERE phone = :phone"),
                {"phone": req.agent_phone},
            ).first()
            if not agent_row or not agent_row[1]:
                raise HTTPException(400, "Agent not found or has no email configured.")

            agent_email_clean = agent_row[1].strip().lower()
            otp_code   = "".join(secrets.choice("0123456789") for _ in range(6))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

            conn.execute(
                text("""
                    INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                    VALUES (:uid, :otp, 'transfer', :exp, false)
                """),
                {"uid": uid_int, "otp": otp_code, "exp": expires_at},
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    send_otp_email(agent_email_clean, otp_code)
    return {"status": "success", "detail": "Cash-in OTP sent to agent's email."}


# ── POST /api/transactions/cashin  (CashInPage) ──────────────────────────────

@router.post("/transactions/cashin")
def cash_in(
    req: CashInOutRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    otp_clean = req.otp.strip()

    with db.connection().engine.connect() as conn:
        try:
            otp_row = conn.execute(
                text("""
                    SELECT otp_id, expires_at, is_used
                    FROM otp_verifications
                    WHERE user_id = :uid
                      AND otp_code = :otp_code
                      AND purpose = 'transfer'
                      AND is_used = false
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"uid": uid_int, "otp_code": otp_clean},
            ).first()
            if not otp_row:
                raise HTTPException(400, "Invalid or missing OTP.")

            otp_id, db_expires, is_used = otp_row[0], otp_row[1], otp_row[2]
            now = datetime.now(timezone.utc)

            if isinstance(db_expires, str):
                from dateutil.parser import parse
                db_expires = parse(db_expires)

            if db_expires.tzinfo is None:
                db_expires = db_expires.replace(tzinfo=timezone.utc)

            if db_expires < now:
                raise HTTPException(400, "OTP is invalid or expired.")

            conn.execute(
                text("UPDATE otp_verifications SET is_used = true WHERE otp_id = :oid"),
                {"oid": otp_id},
            )

            pw_row = conn.execute(
                text("SELECT password_hash FROM users WHERE user_id = :uid"),
                {"uid": uid_int},
            ).first()
            if not pw_row or not verify_pin(req.pin, pw_row[0]):
                raise HTTPException(401, "Invalid PIN.")

            agent_wallet = conn.execute(
                text("""
                    SELECT w.wallet_id, w.balance, u.user_id
                    FROM wallets w JOIN users u ON u.user_id = w.user_id
                    WHERE u.phone = :p
                """),
                {"p": req.agent_phone},
            ).first()
            if not agent_wallet or agent_wallet[1] < req.amount:
                raise HTTPException(400, "Agent has insufficient funds.")

            user_wallet = conn.execute(
                text("SELECT wallet_id FROM wallets WHERE user_id = :uid"),
                {"uid": uid_int},
            ).first()
            if not user_wallet:
                raise HTTPException(400, "User wallet not found.")

            conn.execute(
                text("UPDATE wallets SET balance = balance - :amt WHERE wallet_id = :wid"),
                {"amt": req.amount, "wid": agent_wallet[0]},
            )
            conn.execute(
                text("UPDATE wallets SET balance = balance + :amt WHERE wallet_id = :wid"),
                {"amt": req.amount, "wid": user_wallet[0]},
            )

            reward_row = conn.execute(
                text("SELECT current_points, tier FROM reward_points WHERE user_id = :uid FOR UPDATE"),
                {"uid": uid_int}
            ).first()

            if reward_row:
                curr_pts, curr_tier = reward_row[0], reward_row[1]
                rate = 0.1
                if curr_tier == "silver":     rate = 0.125
                elif curr_tier == "gold":     rate = 0.15
                elif curr_tier == "platinum": rate = 0.20

                earned  = int(req.amount * rate)
                new_pts = curr_pts + earned

                new_tier = "bronze"
                if new_pts >= 15000:  new_tier = "platinum"
                elif new_pts >= 5000: new_tier = "gold"
                elif new_pts >= 1000: new_tier = "silver"

                # FIX: correct indentation + CAST to avoid psycopg type ambiguity
                conn.execute(
                    text("""
                        UPDATE reward_points
                        SET current_points = current_points + :earned,
                            lifetime_earned = lifetime_earned + :earned,
                            tier = CAST(:ntier AS VARCHAR),
                            updated_at = now(),
                            tier_updated_at = CASE WHEN tier <> CAST(:ntier AS VARCHAR) THEN now() ELSE tier_updated_at END
                        WHERE user_id = :uid
                    """),
                    {"earned": earned, "ntier": new_tier, "uid": uid_int}
                )

            conn.execute(
                text("""
                    UPDATE favorite_contacts
                    SET total_txn = total_txn + 1
                    WHERE (owner_user_id = :oid AND contact_user_id = :cid)
                       OR (owner_user_id = :cid AND contact_user_id = :oid)
                """),
                {"oid": uid_int, "cid": agent_wallet[2]}
            )

            ref = f"TXN{int(datetime.now(timezone.utc).timestamp())}{random.randint(100, 999)}"
            res = conn.execute(
                text("""
                    INSERT INTO transactions
                        (reference_no, sender_wallet_id, receiver_wallet_id,
                         txn_type, amount, fee, status)
                    VALUES (:ref, :aw, :uw, 'cashin', :amt, 0.00, 'success')
                    RETURNING txn_id
                """),
                {"ref": ref, "aw": agent_wallet[0], "uw": user_wallet[0], "amt": req.amount},
            )
            txn_id = res.first()[0]

            if req.amount >= 40000:
                conn.execute(
                    text("""
                        INSERT INTO fraud_flags (txn_id, user_id, rule_triggered, risk_score)
                        VALUES (:tid, :uid, :rule, :score)
                    """),
                    {"tid": txn_id, "uid": uid_int,
                     "rule": "Large Deposit Flag (>= \u09f340,000)",
                     "score": random.randint(70, 90)}
                )

            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    return {"message": "Cash in successful", "transaction_id": ref}


# ── POST /api/transactions/bill/send-otp  (BillPaymentPage) ──────────────────

@router.post("/transactions/bill/send-otp")
def send_bill_otp(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        try:
            user_row = conn.execute(
                text("SELECT email FROM users WHERE user_id = :uid"),
                {"uid": uid_int},
            ).first()
            if not user_row or not user_row[0]:
                raise HTTPException(400, "No email configured for this account.")

            user_email = user_row[0].strip().lower()
            otp_code   = "".join(secrets.choice("0123456789") for _ in range(6))
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

            conn.execute(
                text("""
                    INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                    VALUES (:uid, :otp, 'transfer', :exp, false)
                """),
                {"uid": uid_int, "otp": otp_code, "exp": expires_at},
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    send_otp_email(user_email, otp_code)
    return {"status": "success", "detail": "Bill payment OTP sent to your email."}


# ── POST /api/transactions/bill  (BillPaymentPage) ───────────────────────────

@router.post("/transactions/bill")
def pay_bill(
    req: BillPaymentRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    otp_clean = req.otp.strip()

    with db.connection().engine.connect() as conn:
        try:
            otp_row = conn.execute(
                text("""
                    SELECT otp_id, expires_at, is_used
                    FROM otp_verifications
                    WHERE user_id = :uid
                      AND otp_code = :otp_code
                      AND purpose = 'transfer'
                      AND is_used = false
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {"uid": uid_int, "otp_code": otp_clean},
            ).first()
            if not otp_row:
                raise HTTPException(400, "Invalid or missing OTP.")

            otp_id, db_expires, is_used = otp_row[0], otp_row[1], otp_row[2]

            if isinstance(db_expires, str):
                from dateutil.parser import parse
                db_expires = parse(db_expires)

            if db_expires.tzinfo is None:
                db_expires = db_expires.replace(tzinfo=timezone.utc)

            if db_expires < datetime.now(timezone.utc):
                raise HTTPException(400, "OTP is invalid or expired.")

            conn.execute(
                text("UPDATE otp_verifications SET is_used = true WHERE otp_id = :oid"),
                {"oid": otp_id},
            )

            sys_wallet = conn.execute(
                text("SELECT wallet_id FROM wallets WHERE wallet_number = 'BILL_SYSTEM'")
            ).first()
            if not sys_wallet:
                sys_user = conn.execute(
                    text("""
                        INSERT INTO users (full_name, phone, email, password_hash, user_type, is_verified)
                        VALUES ('System Bill Collector', 'BILL_SYSTEM',
                                'billsys@poishagoapp.internal', 'SYSTEM_HASH', 'personal', true)
                        ON CONFLICT (phone) DO NOTHING
                        RETURNING user_id
                    """)
                ).first()
                if sys_user:
                    conn.execute(
                        text("""
                            INSERT INTO wallets (user_id, wallet_number, balance, is_active)
                            VALUES (:uid, 'BILL_SYSTEM', 999999999.00, true)
                            ON CONFLICT DO NOTHING
                        """),
                        {"uid": sys_user[0]},
                    )
                sys_wallet = conn.execute(
                    text("SELECT wallet_id FROM wallets WHERE wallet_number = 'BILL_SYSTEM'")
                ).first()

            if not sys_wallet:
                raise HTTPException(500, "Bill system wallet not configured.")

            sys_phone_row = conn.execute(
                text("""
                    SELECT u.phone FROM users u
                    JOIN wallets w ON w.user_id = u.user_id
                    WHERE w.wallet_number = 'BILL_SYSTEM'
                """)
            ).first()
            sys_phone = sys_phone_row[0] if sys_phone_row else None
            if not sys_phone:
                raise HTTPException(500, "Bill system phone not found.")

            ref, txn_id, cb_amt, cb_name = _execute_transfer(
                conn, uid_int, req.pin, req.amount, sys_phone, "bill"
            )

            txn_row = conn.execute(
                text("SELECT txn_id FROM transactions WHERE reference_no = :ref"),
                {"ref": ref}
            ).first()

            b_name_upper = req.biller_name.upper()
            if any(x in b_name_upper for x in ["DESCO", "DPDC", "NESCO"]):
                b_type = "ELECTRICITY"
            elif "WASA" in b_name_upper:
                b_type = "WATER"
            elif "GAS" in b_name_upper:
                b_type = "GAS"
            elif any(x in b_name_upper for x in ["INTERNET", "BROADBAND", "LINK3", "AMBER"]):
                b_type = "INTERNET"
            elif any(x in b_name_upper for x in ["MOBILE", "RECHARGE", "GP", "ROBI", "AIRTEL", "BANGLALINK", "TELETALK"]):
                b_type = "MOBILE"
            else:
                b_type = "OTHER"

            if txn_row:
                conn.execute(
                    text("""
                        INSERT INTO bill_payments
                            (txn_id, user_id, company_name, bill_type, account_no, due_date, amount, status)
                        VALUES (:tid, :uid, :cname, :btype, :acc, :ddate, :amt, 'SUCCESS')
                    """),
                    {
                        "tid": txn_row[0], "uid": uid_int, "cname": req.biller_name,
                        "btype": b_type, "acc": req.account_number, "amt": req.amount,
                        "ddate": datetime.now(timezone.utc).date()
                    }
                )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    return {
        "message": "Bill paid successfully",
        "transaction_id": ref,
        "cashback_amount": cb_amt,
        "cashback_campaign": cb_name,
    }


# ── POST /api/recharge  (MobileRechargePage) ─────────────────────────────────

VALID_OPERATORS = {"gp", "robi", "airtel", "banglalink", "teletalk"}

@router.post("/recharge")
def mobile_recharge(
    req: RechargeRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    if req.amount < 10 or req.amount > 1000:
        raise HTTPException(400, "Recharge amount must be between \u09f310 and \u09f31,000.")

    if req.operator not in VALID_OPERATORS:
        raise HTTPException(400, f"Invalid operator. Choose from: {', '.join(VALID_OPERATORS)}")

    with db.connection().engine.connect() as conn:
        try:
            sys_phone_row = conn.execute(
                text("""
                    SELECT u.phone FROM users u
                    JOIN wallets w ON w.user_id = u.user_id
                    WHERE w.wallet_number = 'BILL_SYSTEM'
                """)
            ).first()
            sys_phone = sys_phone_row[0] if sys_phone_row else None
            if not sys_phone:
                raise HTTPException(500, "Bill system not configured. Please contact support.")

            # FIX: use "bill" not "recharge" — DB CHECK only allows transfer/cashout/cashin/bill
            ref, txn_id, cb_amt, cb_name = _execute_transfer(
                conn, uid_int, req.pin, req.amount, sys_phone, "bill"
            )

            txn_row = conn.execute(
                text("SELECT txn_id FROM transactions WHERE reference_no = :ref"),
                {"ref": ref}
            ).first()

            if txn_row:
                conn.execute(
                    text("""
                        INSERT INTO bill_payments
                            (txn_id, user_id, company_name, bill_type, account_no, due_date, amount, status)
                        VALUES (:tid, :uid, :cname, 'MOBILE', :acc, :ddate, :amt, 'SUCCESS')
                    """),
                    {
                        "tid": txn_row[0], "uid": uid_int, "cname": req.operator.upper(),
                        "acc": req.phone, "amt": req.amount,
                        "ddate": datetime.now(timezone.utc).date()
                    }
                )
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    return {
        "message": "Recharge successful",
        "transaction_id": ref,
        "cashback_amount": cb_amt,
        "cashback_campaign": cb_name,
    }


# ── GET /api/transactions  (TransactionHistoryPage) ──────────────────────────

@router.get("/transactions")
def get_transactions(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        wallet = conn.execute(
            text("SELECT wallet_id FROM wallets WHERE user_id = :uid"),
            {"uid": uid_int},
        ).first()
        if not wallet:
            return []

        rows = conn.execute(
            text("""
                SELECT
                    t.txn_id, t.reference_no, t.amount, t.txn_type,
                    t.status, t.fee, t.txn_at,
                    su.full_name        AS sender_name,
                    sw.wallet_number    AS sender_wallet_id,
                    ru.full_name        AS receiver_name,
                    rw.wallet_number    AS receiver_wallet_id
                FROM transactions t
                JOIN wallets sw ON sw.wallet_id = t.sender_wallet_id
                JOIN users   su ON su.user_id   = sw.user_id
                JOIN wallets rw ON rw.wallet_id = t.receiver_wallet_id
                JOIN users   ru ON ru.user_id   = rw.user_id
                WHERE t.sender_wallet_id   = :wid
                   OR t.receiver_wallet_id = :wid
                ORDER BY t.txn_at DESC
                LIMIT 50
            """),
            {"wid": wallet[0]},
        ).mappings().all()

        # FIX: distinguish mobile recharge from bill pay via bill_payments.bill_type
        status_map = {
            "success": "completed",
            "pending": "pending",
            "failed":  "failed",
            "flagged": "failed",
        }

        base_type_map = {
            "transfer": "send_money",
            "cashout":  "cash_out",
            "cashin":   "cash_in",
        }

        result = []
        for r in rows:
            raw_type = r["txn_type"]
            if raw_type == "bill":
                bill_row = conn.execute(
                    text("SELECT bill_type FROM bill_payments WHERE txn_id = :tid"),
                    {"tid": r["txn_id"]}
                ).first()
                if bill_row and bill_row[0] == "MOBILE":
                    mapped_type = "mobile_recharge"
                else:
                    mapped_type = "bill_pay"
            else:
                mapped_type = base_type_map.get(raw_type, raw_type)

            result.append({
                "txn_id":             r["txn_id"],
                "sender_wallet_id":   r["sender_wallet_id"],
                "sender_name":        r["sender_name"],
                "receiver_wallet_id": r["receiver_wallet_id"],
                "receiver_name":      r["receiver_name"],
                "amount":             float(r["amount"]),
                "txn_type":           mapped_type,
                "status":             status_map.get(r["status"], r["status"]),
                "fee":                float(r["fee"]),
                "reference_no":       r["reference_no"],
                "txn_at":             r["txn_at"].isoformat(),
            })

        return result


# ── GET /api/admin/transactions  (AdminDashboardPage) ────────────────────────

@router.get("/admin/transactions")
def get_admin_transactions(
    admin: dict = Depends(require_permission("VIEW_REPORTS")),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    t.txn_id, t.reference_no, t.amount, t.txn_type,
                    t.status, t.fee, t.txn_at,
                    su.full_name        AS sender_name,
                    sw.wallet_number    AS sender_wallet_id,
                    ru.full_name        AS receiver_name,
                    rw.wallet_number    AS receiver_wallet_id
                FROM transactions t
                JOIN wallets sw ON sw.wallet_id = t.sender_wallet_id
                JOIN users   su ON su.user_id   = sw.user_id
                JOIN wallets rw ON rw.wallet_id = t.receiver_wallet_id
                JOIN users   ru ON ru.user_id   = rw.user_id
                LEFT JOIN bill_payments bp ON bp.txn_id = t.txn_id
                ORDER BY t.txn_at DESC
                LIMIT 500
            """)
        ).mappings().all()

    base_type_map = {
        "transfer": "send_money",
        "cashout":  "cash_out",
        "cashin":   "cash_in",
    }

    result = []
    for r in rows:
        raw_type = r["txn_type"]
        if raw_type == "bill":
            # Distinguish mobile recharge from utility bill via the bill_payments table
            mapped_type = "mobile_recharge" if r.get("bill_type") == "MOBILE" else "bill_pay"
        else:
            mapped_type = base_type_map.get(raw_type, raw_type)

        result.append({
            "txn_id":             r["txn_id"],
            "sender_wallet_id":   r["sender_wallet_id"],
            "sender_name":        r["sender_name"],
            "receiver_wallet_id": r["receiver_wallet_id"],
            "receiver_name":      r["receiver_name"],
            "amount":             float(r["amount"]),
            "txn_type":           mapped_type,
            "status":             r["status"],
            "fee":                float(r["fee"]),
            "reference_no":       r["reference_no"],
            "txn_at":             r["txn_at"].isoformat(),
        })

    return result


# ── GET /api/admin/revenue-trend  (AdminDashboardPage chart) ─────────────────

@router.get("/admin/revenue-trend")
def get_revenue_trend(
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                WITH dates AS (
                    SELECT generate_series(
                        CURRENT_DATE - INTERVAL '6 days',
                        CURRENT_DATE,
                        '1 day'::interval
                    )::date AS day_date
                )
                SELECT
                    to_char(dates.day_date, 'Dy')  AS day,
                    COALESCE(SUM(t.fee), 0)        AS revenue
                FROM dates
                LEFT JOIN transactions t
                       ON t.txn_at::date = dates.day_date
                      AND t.status = 'success'
                GROUP BY dates.day_date
                ORDER BY dates.day_date ASC
            """)
        ).mappings().all()

    return [{"day": r["day"], "revenue": float(r["revenue"])} for r in rows]
