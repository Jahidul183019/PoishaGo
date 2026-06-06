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
from fastapi import Header, HTTPException

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
