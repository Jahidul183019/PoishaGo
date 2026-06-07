"""
database.py
-----------
SQLAlchemy engine + session factory.
Use get_db() as a FastAPI dependency to get a scoped Session per request.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,
    connect_args={"prepare_threshold": None}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it on exit."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
