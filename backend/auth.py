"""
routers/auth.py
---------------
Registration, login, /me profile, and admin login.

Frontend pages:
  RegisterPage   → POST /api/register
  LoginPage      → POST /api/login
  AdminLoginPage → POST /api/admin/login
  HomePage       → GET  /api/me
  ProfilePage    → GET  /api/me
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth_schemas import RegisterPayload, LoginRequest, AdminLoginRequest, ChangePinRequest, UpdateProfileRequest
from auth_schemas import ResetPinRequest
from database import get_db
from dependencies import create_access_token, get_current_user
from security import hash_pin, verify_pin
# Import OTP email sender to fire after registration
from auth_otp import send_otp_email

router = APIRouter(prefix="/api", tags=["Auth"])


# ── RegisterPage ──────────────────────────────────────────────────────────────

@router.post("/register")
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    """
    Creates a new user account and sends an OTP to the supplied email.
    The wallet is created only after /api/verify-otp succeeds.
    """
    email_clean   = payload.email.strip().lower()
    phone_clean   = payload.phone.strip()
    nid_clean     = payload.nid_number.strip()
    type_clean    = payload.user_type.strip().lower()

    with db.connection().engine.connect() as conn:
        # ── Duplicate checks ──
        if conn.execute(
            text("SELECT EXISTS(SELECT 1 FROM users WHERE email = :e)"), {"e": email_clean}
        ).scalar():
            raise HTTPException(400, "An account with this email already exists.")

        if conn.execute(
            text("SELECT EXISTS(SELECT 1 FROM users WHERE phone = :p)"), {"p": phone_clean}
        ).scalar():
            raise HTTPException(400, "An account with this mobile number already exists.")

        if conn.execute(
            text("SELECT EXISTS(SELECT 1 FROM users WHERE nid = :n)"), {"n": nid_clean}
        ).scalar():
            raise HTTPException(400, "An account with this NID already exists.")

        # ── Insert user ──
        row = conn.execute(
            text("""
                INSERT INTO users
                    (full_name, phone, email, password_hash, nid, user_type, is_verified)
                VALUES
                    (:name, :phone, :email, :pw, :nid, :utype, false)
                RETURNING user_id
            """),
            {
                "name":  payload.full_name.strip(),
                "phone": phone_clean,
                "email": email_clean,
                "pw":    hash_pin(payload.pin),
                "nid":   nid_clean,
                "utype": type_clean,
            },
        ).mappings().first()

        user_id = row["user_id"]

        # ── Insert registration OTP ──
        otp_code  = "".join(secrets.choice("0123456789") for _ in range(6))
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

        conn.execute(
            text("""
                INSERT INTO otp_verifications
                    (user_id, otp_code, purpose, expires_at, is_used)
                VALUES (:uid, :otp, 'register', :exp, false)
            """),
            {"uid": user_id, "otp": otp_code, "exp": expires_at},
        )
        conn.commit()

    send_otp_email(email_clean, otp_code)
    return {"status": "success", "detail": "Account created! Verification code sent."}


# ── LoginPage ─────────────────────────────────────────────────────────────────

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a citizen by phone + PIN.
    Returns a JWT access token on success.
    """
    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT user_id, password_hash, is_verified
                FROM users WHERE phone = :p
            """),
            {"p": payload.phone.strip()},
        ).first()

    if not row:
        raise HTTPException(401, "Invalid credentials.")

    user_id, pw_hash, is_verified = row

    if not verify_pin(payload.pin, pw_hash):
        raise HTTPException(401, "Invalid credentials.")

    if not is_verified:
        raise HTTPException(403, "Account not verified. Please complete OTP verification.")

    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token, "token_type": "bearer"}


# ── AdminLoginPage ────────────────────────────────────────────────────────────

@router.post("/admin/login")
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates an admin by phone-or-email + passcode.
    Returns token and the admin role so the frontend can route correctly.
    """
    ident = payload.username.strip()

    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT u.user_id, u.password_hash, a.role
                FROM users u
                JOIN admins a ON a.user_id = u.user_id
                WHERE u.phone = :id OR u.email = :id
            """),
            {"id": ident},
        ).first()

    if not row:
        raise HTTPException(401, "Invalid admin credentials.")

    user_id, pw_hash, role = row

    if not verify_pin(payload.passcode, pw_hash):
        raise HTTPException(401, "Invalid admin credentials.")

    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token, "token_type": "bearer", "role": role}


# ── /api/me  (HomePage, ProfilePage) ─────────────────────────────────────────

@router.get("/me")
def get_me(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns the full profile for the currently authenticated user,
    including wallet balance and loyalty points.
    Used by: HomePage, ProfilePage, and the auth store on every login.
    """
    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT
                    u.user_id, u.full_name, u.phone, u.email,
                    u.user_type, u.is_verified,
                    w.wallet_number, w.balance, w.wallet_id,
                    COALESCE(r.current_points, 0)  AS current_points,
                    COALESCE(r.tier, 'bronze')      AS tier
                FROM users u
                LEFT JOIN wallets       w ON w.user_id  = u.user_id
                LEFT JOIN reward_points r ON r.user_id  = u.user_id
                WHERE u.user_id = :uid
            """),
            {"uid": user_id},
        ).mappings().first()

    if not row:
        raise HTTPException(404, "User not found.")

    return dict(row)


@router.post("/reset-pin")
def reset_pin(payload: ResetPinRequest, user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows a verified user (with a valid token) to set a new PIN without providing the old one.
    This is intended to be used after an OTP-based verification that returned a short-lived JWT.
    """
    if not payload.new_pin or len(payload.new_pin) != 6:
        raise HTTPException(400, "Invalid PIN format")

    with db.connection().engine.connect() as conn:
        conn.execute(
            text("UPDATE users SET password_hash = :ph WHERE user_id = :uid"),
            {"ph": hash_pin(payload.new_pin), "uid": user_id},
        )
        conn.commit()

    return {"status": "success", "detail": "PIN updated successfully."}


@router.patch("/me")
def update_profile(
    payload: UpdateProfileRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Allow updating full_name and email. Email must be unique.
    with db.connection().engine.connect() as conn:
        if payload.email:
            email_clean = payload.email.strip().lower()
            exists = conn.execute(
                text("SELECT EXISTS(SELECT 1 FROM users WHERE email = :e AND user_id <> :uid)"),
                {"e": email_clean, "uid": user_id},
            ).scalar()
            if exists:
                raise HTTPException(400, "Email already in use by another account.")

        conn.execute(
            text("""
                UPDATE users
                SET full_name = COALESCE(:name, full_name),
                    email = COALESCE(:email, email)
                WHERE user_id = :uid
            """),
            {"name": payload.full_name, "email": (payload.email.strip().lower() if payload.email else None), "uid": user_id},
        )
        conn.commit()

    # return updated profile
    return get_me(user_id, db)


# ── ProfilePage PIN change ─────────────────────────────────────────────────────

@router.post("/change-pin")
def change_pin(
    payload: ChangePinRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("SELECT password_hash FROM users WHERE user_id = :uid"),
            {"uid": user_id},
        ).first()

        if not row:
            raise HTTPException(404, "User not found.")

        if not verify_pin(payload.old_pin, row[0]):
            raise HTTPException(401, "Invalid current PIN.")

        conn.execute(
            text("UPDATE users SET password_hash = :pw WHERE user_id = :uid"),
            {"pw": hash_pin(payload.new_pin), "uid": user_id},
        )
        conn.commit()

    return {"status": "success", "detail": "Security PIN updated successfully."}
