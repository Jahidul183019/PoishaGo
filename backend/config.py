"""
config.py
---------
Centralised settings loaded from environment variables.
All modules import from here — never from os.getenv() directly.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "PoishaGo API"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Email / SMTP
    GMAIL_USER: str = os.getenv("GMAIL_USER", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))

settings = Settings()

if not settings.JWT_SECRET or len(settings.JWT_SECRET) < 32:
    # Force a secure fallback if .env is missing or the provided key is too short for SHA256
    print("WARNING: JWT_SECRET is missing or too short (< 32 chars). Using secure development fallback.")
    settings.JWT_SECRET = "7d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"
if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
