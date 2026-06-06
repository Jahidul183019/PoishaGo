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
from dependencies import get_current_admin, require_permission

router = APIRouter(prefix="/api", tags=["Bills"])


class BillCategoryRequest(BaseModel):
    id: str
    label: str
    icon_id: str
    color: str

@router.get("/bill/categories")
def get_bill_categories(db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(text("SELECT id, label, icon_id, color FROM bill_categories ORDER BY created_at ASC")).mappings().all()
    return [dict(r) for r in rows]

# ── Admin: POST /api/admin/bill/categories  (AdminConfigPage) ────────────────

@router.post("/admin/bill/categories")
def create_bill_category(
    req: BillCategoryRequest, 
    admin: dict = Depends(require_permission("MANAGE_CONFIG")),
    db: Session = Depends(get_db)
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO bill_categories (id, label, icon_id, color)
                VALUES (:id, :label, :icon, :color)
                ON CONFLICT (id) DO UPDATE SET 
                    label = EXCLUDED.label, 
                    icon_id = EXCLUDED.icon_id, 
                    color = EXCLUDED.color
            """),
            {"id": req.id, "label": req.label, "icon": req.icon_id, "color": req.color}
        )
        conn.commit()
    return {"message": "Bill category saved"}


# ── Admin: DELETE /api/admin/bill/categories/{id}  (AdminConfigPage) ─────────

@router.delete("/admin/bill/categories/{category_id}")
def delete_bill_category(
    category_id: str, 
    admin: dict = Depends(require_permission("MANAGE_CONFIG")),
    db: Session = Depends(get_db)
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM bill_categories WHERE id = :id"),
            {"id": category_id}
        )
        conn.commit()
    return {"message": "Bill category deleted"}
