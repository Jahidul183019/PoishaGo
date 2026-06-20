"""
routers/bills.py
----------------
Bill categories configuration.

Frontend pages:
  BillPaymentPage  → GET  /api/bill/categories
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/api", tags=["Bills"])


@router.get("/bill/categories")
def get_bill_categories(db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(text("SELECT id, label, icon_id, color FROM bill_categories ORDER BY created_at ASC")).mappings().all()
    return [dict(r) for r in rows]

@router.get("/bill/providers")
def get_bill_providers(db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(text("SELECT category, name FROM bill_providers")).mappings().all()
    
    # Group by category for frontend convenience
    providers_map = {}
    for r in rows:
        cat = r["category"]
        if cat not in providers_map:
            providers_map[cat] = []
        providers_map[cat].append(r["name"])
        
    return providers_map


