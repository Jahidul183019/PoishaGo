"""
security.py
-----------
Password hashing helpers.  All PIN/password operations go through here.
"""

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pin(plain: str) -> str:
    """Return a bcrypt hash of the given plaintext PIN."""
    return _pwd_context.hash(plain)


def verify_pin(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return _pwd_context.verify(plain, hashed)
