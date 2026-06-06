"""
dependencies.py
---------------
Shared FastAPI dependencies:
  - get_db            → DB session (from database.py)
  - get_current_user  → validates Bearer JWT, returns user_id string
  - create_access_token
"""

from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

from config import settings


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
    with db.connection().engine.connect() as conn:
        row = conn.execute(
            text("SELECT admin_id, role FROM admins WHERE user_id = :uid"),
            {"uid": user_id}
        ).first()
        if not row:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Fetch permissions for this role
        perms_rows = conn.execute(
            text("SELECT permission FROM admin_permissions WHERE role = :role"),
            {"role": row[1]}
        ).all()
        permissions = [p[0] for p in perms_rows]
        
        return {
            "admin_id": row[0], 
            "role": row[1], 
            "user_id": user_id,
            "permissions": permissions
        }

def require_permission(permission: str):
    """Dependency factory to enforce specific admin permissions."""
    def permission_checker(admin: dict = Depends(get_current_admin)):
        if permission not in admin["permissions"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}"
            )
        return admin
    return permission_checker
