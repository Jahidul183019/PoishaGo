"""
security.py
-----------
Password hashing helpers.  All PIN/password operations go through here.
"""

import bcrypt

def hash_pin(plain: str) -> str:
    """Return a bcrypt hash of the given plaintext PIN."""
    salt = bcrypt.gensalt(rounds=4)
    return bcrypt.hashpw(plain.encode('utf-8'), salt).decode('utf-8')
    # Step 1: plain text PIN → convert to bytes (encode)
    # Step 2: bcrypt hashes it using the salt
    # Step 3: result is bytes → convert to string (decode) for DB storage

def verify_pin(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False
