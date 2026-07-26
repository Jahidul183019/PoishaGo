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

    # Email / Brevo
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "")

    # CORS — comma-separated origins; localhost only in debug mode
    @property
    def CORS_ORIGINS(self) -> list[str]:
        env_origins = os.getenv("CORS_ORIGINS", "")
        if env_origins:
            return [o.strip() for o in env_origins.split(",") if o.strip()]
        origins = ["https://poisha-go.vercel.app"]
        if self.DEBUG:
            origins.extend(["http://localhost:3000", "http://127.0.0.1:3000",
                            "http://localhost:5173", "http://127.0.0.1:5173"])
        return origins

settings = Settings()

if not settings.JWT_SECRET or len(settings.JWT_SECRET) < 32:
    raise ValueError("JWT_SECRET environment variable is missing or too short (< 32 chars)")
if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

