"""
routers/user.py
---------------
User-facing data: contacts, notifications, agents, users list.

Frontend pages:
  SendMoneyPage      → GET  /api/contacts
                     → POST /api/contacts
                     → DELETE /api/contacts/{id}
  NotificationsPage  → GET  /api/notifications
  CashInPage         → GET  /api/agents
  CashOutPage        → GET  /api/agents
  AdminUserTxnMgmt   → GET  /api/users
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_admin, require_permission

router = APIRouter(prefix="/api", tags=["User"])


# ── /api/agents  (CashInPage, CashOutPage) ───────────────────────────────────

@router.get("/agents")
def get_agents(db: Session = Depends(get_db)):
    """Returns all verified agent accounts with id, name, phone, location."""
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    user_id::text          AS id,
                    full_name              AS name,
                    phone,
                    'Verified Agent Store' AS location
                FROM users
                WHERE user_type = 'agent' AND is_verified = true
            """)
        ).mappings().all()
    return [dict(r) for r in rows]


# ── /api/contacts  (SendMoneyPage) ───────────────────────────────────────────

class AddContactRequest(BaseModel):
    phone: str
    nickname: str = ""


@router.get("/contacts")
def get_contacts(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's saved favourite contacts."""
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    fc.contact_id,
                    COALESCE(fc.nickname, u.full_name) AS name,
                    u.phone
                FROM favorite_contacts fc
                JOIN users u ON u.user_id = fc.contact_user_id
                WHERE fc.owner_user_id = :uid
                ORDER BY fc.added_at DESC
                LIMIT 50
            """),
            {"uid": user_id},
        ).mappings().all()

    result = []
    for c in rows:
        display = c["name"]
        initials = "".join(p[0] for p in display.split()[:2]).upper() or "U"
        result.append({
            "contact_id": c["contact_id"],
            "name":       display,
            "phone":      c["phone"],
            "initials":   initials,
        })
    return result


@router.post("/contacts")
def add_contact(
    req: AddContactRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        contact_user = conn.execute(
            text("SELECT user_id, full_name FROM users WHERE phone = :p"),
            {"p": req.phone.strip()},
        ).first()
        if not contact_user:
            raise HTTPException(404, "No PoishaGo account found with this phone number.")
        if str(contact_user[0]) == str(user_id):
            raise HTTPException(400, "You cannot add yourself as a contact.")

        existing = conn.execute(
            text("""
                SELECT contact_id FROM favorite_contacts
                WHERE owner_user_id = :oid AND contact_user_id = :cid
            """),
            {"oid": user_id, "cid": contact_user[0]},
        ).first()
        if existing:
            raise HTTPException(409, "This contact is already in your list.")

        conn.execute(
            text("""
                INSERT INTO favorite_contacts (owner_user_id, contact_user_id, nickname)
                VALUES (:oid, :cid, :nick)
            """),
            {
                "oid":  user_id,
                "cid":  contact_user[0],
                "nick": req.nickname.strip() or None,
            },
        )
        conn.commit()

    return {"message": "Contact added", "name": contact_user[1]}


@router.delete("/contacts/{contact_id}")
def remove_contact(
    contact_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("""
                DELETE FROM favorite_contacts
                WHERE contact_id = :cid AND owner_user_id = :uid
            """),
            {"cid": contact_id, "uid": user_id},
        )
        conn.commit()
    return {"message": "Contact removed"}


# ── /api/notifications  (NotificationsPage) ──────────────────────────────────

@router.get("/notifications")
def get_notifications(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the user's notifications.
    Maps the DB notif_type (sms/email/in_app) to the frontend's
    notif_type (credit/debit/system) based on message content heuristics.
    Also returns a synthetic 'title' from the first sentence.
    """
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT notif_id AS id, message, notif_type, is_read, created_at
                FROM notifications
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT 50
            """),
            {"uid": user_id},
        ).mappings().all()

    result = []
    for n in rows:
        msg = n["message"]
        # Derive a short title (first 40 chars or up to first comma)
        title = msg.split(".")[0][:55] if msg else "Notification"

        # Map notif_type for front-end badge colours
        raw_type = n["notif_type"]
        if raw_type == "sms":
            fe_type = "system"
        elif "received" in msg.lower() or "credited" in msg.lower() or "cashed in" in msg.lower():
            fe_type = "credit"
        elif "transferred" in msg.lower() or "paid" in msg.lower() or "debited" in msg.lower() or "cashed out" in msg.lower():
            fe_type = "debit"
        else:
            fe_type = "system"

        result.append({
            "id":          n["id"],
            "title":       title,
            "message":     msg,
            "notif_type":  fe_type,
            "is_read":     n["is_read"],
            "created_at":  n["created_at"].isoformat(),
        })
    return result


@router.put("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("UPDATE notifications SET is_read = true WHERE notif_id = :nid AND user_id = :uid"),
            {"nid": notif_id, "uid": int(user_id)}
        )
        conn.commit()
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("UPDATE notifications SET is_read = true WHERE user_id = :uid"),
            {"uid": int(user_id)}
        )
        conn.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/notifications/{notif_id}")
def delete_notification(
    notif_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM notifications WHERE notif_id = :nid AND user_id = :uid"),
            {"nid": notif_id, "uid": int(user_id)}
        )
        conn.commit()
    return {"message": "Notification deleted"}


@router.delete("/notifications")
def delete_all_notifications(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM notifications WHERE user_id = :uid"),
            {"uid": int(user_id)}
        )
        conn.commit()
    return {"message": "All notifications deleted"}


# ── /api/users  (AdminUserTxnMgmtPage) ───────────────────────────────────────

@router.get("/users")
def get_users(
    admin: dict = Depends(require_permission("VIEW_USERS")), 
    db: Session = Depends(get_db)
):
    """Returns all users with wallet and reward data for the admin panel."""
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    u.user_id, u.full_name, u.phone, u.email,
                    u.user_type, u.is_verified,
                    w.wallet_number,
                    COALESCE(w.balance, 0.00)           AS balance,
                    CASE WHEN w.is_active THEN 'active'
                         ELSE 'blocked' END             AS status,
                    COALESCE(r.current_points, 0)       AS current_points,
                    COALESCE(r.tier, 'bronze')          AS tier
                FROM users u
                LEFT JOIN wallets       w ON w.user_id = u.user_id
                LEFT JOIN reward_points r ON r.user_id = u.user_id
                ORDER BY u.created_at DESC
            """)
        ).mappings().all()

    return [dict(r) for r in rows]
