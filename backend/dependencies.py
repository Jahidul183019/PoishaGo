"""
dependencies.py
---------------
Shared FastAPI dependencies:
  - get_db            → DB session (from database.py)
  - get_current_user  → validates Bearer JWT, returns user_id string
  - create_access_token
"""

from datetime import datetime, timedelta, timezone
import logging

import jwt
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

from config import settings

logger = logging.getLogger(__name__)


# ── JWT ──────────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Encode a JWT with a 1-day expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_user(authorization: str = Header(None)) -> str:
    """
    FastAPI dependency.
    Reads the 'Authorization: Bearer <token>' header,
    validates the JWT, and returns the subject (user_id as str).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_admin(user_id: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Ensures the authenticated user is an admin and returns their details."""
    uid_int = int(user_id)
    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("SELECT admin_id, role FROM admins WHERE user_id = :uid"),
            {"uid": uid_int}
        ).first()
        if not row:
            logger.error(f"[get_current_admin] No admin found for user_id={uid_int}")
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = row[0]
        role = row[1]

        # Fetch permissions for this role
        perms_rows = conn.execute(
            text("SELECT permission FROM admin_permissions WHERE role = :role"),
            {"role": role}
        ).all()
        permissions = [p[0] for p in perms_rows]
        
        logger.info(f"[get_current_admin] uid={uid_int} admin_id={admin_id} role={role!r} permissions={permissions}")
        
        return {
            "admin_id": admin_id, 
            "role": role, 
            "user_id": user_id,
            "permissions": permissions
        }

def require_permission(permission: str):
    """Dependency factory to enforce specific admin permissions."""
    def permission_checker(admin: dict = Depends(get_current_admin)):
        role = admin.get("role")
        perms = admin.get("permissions", [])
        is_super = role == 'SUPER_ADMIN'
        has_perm = permission in perms
        
        logger.info(f"[require_permission] checking '{permission}': role={role!r} is_super={is_super} has_perm={has_perm} all_perms={perms}")
        
        if is_super or has_perm:
            return admin
        else:
            logger.warning(f"[require_permission] DENIED '{permission}' for role={role!r}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
    return permission_checker
