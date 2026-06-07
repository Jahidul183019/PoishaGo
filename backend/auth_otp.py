"""
routers/auth_otp.py
--------------------
OTP email dispatch and verification.

Frontend pages:
  RegisterPage  → POST /api/register        (sends OTP after account creation)
  OTPPage       → POST /api/send-otp        (resend / password-reset flow)
               → POST /api/verify-otp       (verify 6-digit code)
"""

import secrets
import requests
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth_schemas import SendOTPRequest, VerifyOTPRequest
from security import hash_pin
from dependencies import create_access_token
from config import settings
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["OTP"])


# ── Email helper ──────────────────────────────────────────────────────────────

def send_otp_email(receiver_email: str, otp_code: str) -> None:
    """
    Dispatches a styled HTML OTP email via Brevo HTTP API.
    """
    if not settings.BREVO_API_KEY or not settings.SENDER_EMAIL:
        print(f"[DEV] OTP for {receiver_email}: {otp_code}  (email not configured)")
        return

    html = f"""
    <div style="font-family:sans-serif;padding:20px;max-width:500px;
                border:1px solid #e2e8f0;border-radius:8px;">
      <h2 style="color:#00C9A7;font-size:22px;font-weight:bold;">
        PoishaGo Identity Verification
      </h2>
      <p style="color:#475569;font-size:14px;">
        Use the code below to verify your account. It expires in 5 minutes.
      </p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:6px;
                  text-align:center;margin:30px 0;color:#1e293b;
                  background:#f8fafc;padding:15px;border-radius:6px;">
        {otp_code}
      </div>
      <p style="font-size:12px;color:#94a3b8;">
        If you did not request this, please ignore this email.
      </p>
    </div>
    """

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": settings.BREVO_API_KEY,
                "accept": "application/json",
                "content-type": "application/json"
            },
            json={
                "sender": {"name": "PoishaGo Security", "email": settings.SENDER_EMAIL},
                "to": [{"email": receiver_email}],
                "subject": "Your PoishaGo Verification Code",
                "htmlContent": html
            },
            timeout=5
        )
        response.raise_for_status()
    except Exception as exc:
        print(f"[BREVO ERROR] {exc}")


# ── /api/send-otp  (OTPPage — resend / password-reset) ───────────────────────

@router.post("/send-otp")
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Generates a fresh OTP for a verified or unverified account.
    OTPPage uses this for both:
      - resend during registration  (purpose = 'register')
      - password-reset flow         (purpose = 'register' — same table)
    """
    email_clean = payload.email.strip().lower()

    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("SELECT user_id FROM users WHERE email = :e"),
            {"e": email_clean},
        ).first()

        if not row:
            raise HTTPException(status_code=404, detail="No account registered with this email.")

        user_id = row[0]
        otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        purpose = (payload.purpose or 'register').strip().lower()
        if purpose not in ('register', 'login', 'transfer'):
            purpose = 'register'

        conn.execute(
            text("""
                INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                VALUES (:uid, :otp, :purpose, :exp, false)
            """),
            {"uid": user_id, "otp": otp_code, "exp": expires_at, "purpose": purpose},
        )
        conn.commit()

    send_otp_email(email_clean, otp_code)
    return {"status": "success", "detail": "Verification code sent."}


@router.post("/send-transfer-otp")
def send_transfer_otp(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Sends a one-time OTP to the authenticated user's registered email
    for authorizing a transfer. Purpose stored as 'transfer'.
    """
    with db.connection().engine.connect() as conn:
        user_row = conn.execute(
            text("SELECT email FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).first()
        if not user_row or not user_row[0]:
            raise HTTPException(status_code=400, detail="No email configured for this account.")

        email_clean = user_row[0].strip().lower()
        otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

        conn.execute(
            text("""
                INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at, is_used)
                VALUES (:uid, :otp, 'transfer', :exp, false)
            """),
            {"uid": user_id, "otp": otp_code, "exp": expires_at},
        )
        conn.commit()

    send_otp_email(email_clean, otp_code)
    return {"status": "success", "detail": "Transfer OTP sent to your email."}


# ── /api/verify-otp  (OTPPage — confirm code) ────────────────────────────────

@router.post("/verify-otp")
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Validates the 6-digit OTP and marks the user as verified.
    Also creates a wallet for the user if one doesn't exist yet.
    Used by OTPPage after both registration and password-reset flows.
    """
    email_clean = payload.email.strip().lower()
    otp_clean   = payload.otp.strip()

    with db.connection().engine.connect() as conn:
        # 1. Resolve user
        user_row = conn.execute(
            text("SELECT user_id FROM users WHERE email = :e"),
            {"e": email_clean},
        ).first()

        if not user_row:
            raise HTTPException(status_code=404, detail="User not found.")

        user_id = user_row[0]

        # 2. Find latest valid unused OTP
        purpose = (payload.purpose or 'register').strip().lower()
        if purpose not in ('register', 'login', 'transfer'):
            purpose = 'register'

        otp_row = conn.execute(
            text("""
                SELECT otp_id, expires_at, is_used
                FROM otp_verifications
                WHERE user_id  = :uid
                  AND otp_code = :otp
                  AND purpose  = :purpose
                ORDER BY created_at DESC
                LIMIT 1
            """),
            {"uid": user_id, "otp": otp_clean, "purpose": purpose},
        ).first()

        if not otp_row:
            raise HTTPException(status_code=400, detail="Invalid verification code.")

        otp_id, db_expires, was_used = otp_row[0], otp_row[1], otp_row[2]

        # 3. Expiry check
        now = datetime.now(timezone.utc)
        if db_expires.tzinfo is None:
            db_expires = db_expires.replace(tzinfo=timezone.utc)
        if db_expires < now:
            raise HTTPException(status_code=400, detail="Verification code has expired.")

        # 4. Burn OTP
        conn.execute(
            text("UPDATE otp_verifications SET is_used = true WHERE otp_id = :oid"),
            {"oid": otp_id},
        )

        # 5. Behavior differs by purpose
        if purpose == 'register':
            conn.execute(
                text("UPDATE users SET is_verified = true WHERE user_id = :uid"),
                {"uid": user_id},
            )

            # Create wallet if not already present
            existing_wallet = conn.execute(
                text("SELECT wallet_id FROM wallets WHERE user_id = :uid"),
                {"uid": user_id},
            ).first()

            if not existing_wallet:
                wallet_number = f"PG-WAL-{user_id:05d}"
                conn.execute(
                    text("""
                        INSERT INTO wallets (user_id, wallet_number, balance, is_active)
                        VALUES (:uid, :wnum, 0.00, true)
                    """),
                    {"uid": user_id, "wnum": wallet_number},
                )
            
            # Ensure reward points entry exists for the new citizen
            conn.execute(
                text("""
                    INSERT INTO reward_points (user_id, current_points, tier)
                    VALUES (:uid, 0, 'bronze')
                    ON CONFLICT (user_id) DO NOTHING
                """),
                {"uid": user_id}
            )

            conn.commit()
            
            token = create_access_token({"sub": str(user_id)})
            return {
                "status": "success", 
                "detail": "Account verified successfully!",
                "access_token": token,
                "token_type": "bearer"
            }

        elif purpose == 'login':
            # Make the OTP the user's temporary password (hash it), so the
            # user can use the OTP as their 'old PIN' with the existing
            # /api/change-pin endpoint. Then return an access token.
            conn.execute(
                text("UPDATE users SET password_hash = :ph WHERE user_id = :uid"),
                {"ph": hash_pin(otp_clean), "uid": user_id},
            )
            conn.commit()
            token = create_access_token({"sub": str(user_id)})
            return {"access_token": token, "token_type": "bearer"}

        else:
            # Generic success for other purposes (e.g., transfer)
            conn.commit()
            return {"status": "success", "detail": "Code accepted."}
