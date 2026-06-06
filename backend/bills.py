"""
routers/bills.py
----------------
Bill categories configuration.

Frontend pages:
  BillPaymentPage  → GET  /api/bill/categories
  AdminConfigPage  → POST   /api/admin/bill/categories
                   → DELETE /api/admin/bill/categories/{id}
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(prefix="/api", tags=["Bills"])


class BillCategoryRequest(BaseModel):
    id: str
    label: str
    icon_id: str
    color: str

STATIC_CATEGORIES = [
    {"id": "electricity", "label": "Electricity", "icon_id": "Zap", "color": "text-amber-400 bg-amber-500/10 border-amber-500/20"},
    {"id": "water", "label": "Water", "icon_id": "Droplet", "color": "text-blue-400 bg-blue-500/10 border-blue-500/20"},
    {"id": "gas", "label": "Gas", "icon_id": "Flame", "color": "text-rose-400 bg-rose-500/10 border-rose-500/20"},
    {"id": "internet", "label": "Internet", "icon_id": "Globe", "color": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"},
    {"id": "education", "label": "Education", "icon_id": "BookOpen", "color": "text-purple-400 bg-purple-500/10 border-purple-500/20"},
    {"id": "tv", "label": "TV & Cable", "icon_id": "Tv", "color": "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"},
]

# ── GET /api/bill/categories  (BillPaymentPage) ───────────────────────────────

@router.get("/bill/categories")
def get_bill_categories(db: Session = Depends(get_db)):
    """
    Returns all bill categories from a static list to avoid schema dependency.
    """
    # We return the static list directly since the bill_categories table 
    # is not present in the current schema.sql.
    return STATIC_CATEGORIES

# ── Admin: POST /api/admin/bill/categories  (AdminConfigPage) ────────────────

@router.post("/admin/bill/categories")
def create_bill_category(req: BillCategoryRequest, db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO bill_categories (id, label, icon_id, color)
                VALUES (:id, :label, :icon, :color)
                ON CONFLICT (id) DO UPDATE
                    SET label   = EXCLUDED.label,
                        icon_id = EXCLUDED.icon_id,
                        color   = EXCLUDED.color
            """),
            {"id": req.id, "label": req.label, "icon": req.icon_id, "color": req.color},
        )
        conn.commit()
    return {"message": "Bill category saved"}


# ── Admin: DELETE /api/admin/bill/categories/{id}  (AdminConfigPage) ─────────

@router.delete("/admin/bill/categories/{category_id}")
def delete_bill_category(category_id: str, db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM bill_categories WHERE id = :id"),
            {"id": category_id},
        )
        conn.commit()
    return {"message": "Bill category deleted"}
