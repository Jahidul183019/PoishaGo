"""
support.py
----------
Help Center — WebSocket real-time chat + REST endpoints.
Tables: support_tickets, support_messages  (see schema.sql)
"""

from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from dependencies import get_current_user, get_current_admin

router = APIRouter(tags=["support"])


# ── Pydantic schemas ─────────────────────────────────────────────────────────
class TicketCreate(BaseModel):
    subject: str

class MessageOut(BaseModel):
    message_id: int
    ticket_id: int
    sender_type: str
    sender_id: int
    sender_name: str | None = None
    message: str
    sent_at: str

class TicketOut(BaseModel):
    ticket_id: int
    user_id: int
    user_name: str | None = None
    subject: str
    status: str
    created_at: str
    last_message: str | None = None


# ── WebSocket connection manager ─────────────────────────────────────────────
class ConnectionManager:
    """Manages active WebSocket connections grouped by ticket_id."""

    def __init__(self):
        self.active: Dict[int, List[WebSocket]] = {}

    async def connect(self, ticket_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(ticket_id, []).append(ws)

    def disconnect(self, ticket_id: int, ws: WebSocket):
        if ticket_id in self.active:
            self.active[ticket_id] = [c for c in self.active[ticket_id] if c is not ws]
            if not self.active[ticket_id]:
                del self.active[ticket_id]

    async def broadcast(self, ticket_id: int, payload: dict):
        for ws in self.active.get(ticket_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                pass


manager = ConnectionManager()


# ── REST: User endpoints ─────────────────────────────────────────────────────

@router.post("/api/support/tickets", response_model=TicketOut)
def create_ticket(
    body: TicketCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User creates a new support ticket."""
    row = db.execute(
        text("""
            INSERT INTO support_tickets (user_id, subject)
            VALUES (:uid, :subj) RETURNING ticket_id, status, created_at
        """),
        {"uid": int(user_id), "subj": body.subject},
    )
    db.commit()
    t = row.first()
    return TicketOut(
        ticket_id=t[0],
        user_id=int(user_id),
        subject=body.subject,
        status=t[1],
        created_at=str(t[2]),
    )


@router.get("/api/support/tickets", response_model=list[TicketOut])
def list_my_tickets(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User lists their own tickets."""
    rows = db.execute(
        text("""
            SELECT t.ticket_id, t.user_id, t.subject, t.status, t.created_at,
                   (SELECT sm.message FROM support_messages sm
                    WHERE sm.ticket_id = t.ticket_id
                    ORDER BY sm.sent_at DESC LIMIT 1)
            FROM support_tickets t
            WHERE t.user_id = :uid
            ORDER BY t.created_at DESC
        """),
        {"uid": int(user_id)},
    ).all()
    return [
        TicketOut(
            ticket_id=r[0], user_id=r[1], subject=r[2],
            status=r[3], created_at=str(r[4]), last_message=r[5],
        )
        for r in rows
    ]


@router.get("/api/support/tickets/{ticket_id}/messages", response_model=list[MessageOut])
def get_ticket_messages(
    ticket_id: int,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all messages in a ticket (user must own the ticket)."""
    # Verify ownership
    owner = db.execute(
        text("SELECT user_id FROM support_tickets WHERE ticket_id = :tid"),
        {"tid": ticket_id},
    ).scalar()
    if owner is None:
        raise HTTPException(404, "Ticket not found")
    if str(owner) != str(user_id):
        raise HTTPException(403, "Not your ticket")

    return _fetch_messages(db, ticket_id)


# ── REST: Admin endpoints ────────────────────────────────────────────────────

@router.get("/api/admin/support/tickets", response_model=list[TicketOut])
def admin_list_tickets(
    status: str = Query("OPEN"),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin lists all tickets (filterable by status)."""
    rows = db.execute(
        text("""
            SELECT t.ticket_id, t.user_id, u.full_name, t.subject, t.status, t.created_at,
                   (SELECT sm.message FROM support_messages sm
                    WHERE sm.ticket_id = t.ticket_id
                    ORDER BY sm.sent_at DESC LIMIT 1)
            FROM support_tickets t
            JOIN users u ON u.user_id = t.user_id
            WHERE t.status = :st
            ORDER BY t.created_at DESC
        """),
        {"st": status},
    ).all()
    return [
        TicketOut(
            ticket_id=r[0], user_id=r[1], user_name=r[2], subject=r[3],
            status=r[4], created_at=str(r[5]), last_message=r[6],
        )
        for r in rows
    ]


@router.get("/api/admin/support/tickets/{ticket_id}/messages", response_model=list[MessageOut])
def admin_get_ticket_messages(
    ticket_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin fetches messages for any ticket."""
    return _fetch_messages(db, ticket_id)


@router.patch("/api/admin/support/tickets/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin marks a ticket as resolved."""
    db.execute(
        text("UPDATE support_tickets SET status = 'RESOLVED' WHERE ticket_id = :tid"),
        {"tid": ticket_id},
    )
    db.commit()
    return {"detail": "Ticket resolved"}


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/api/ws/support/{ticket_id}")
async def support_chat(websocket: WebSocket, ticket_id: int, token: str = Query(...)):
    """
    Real-time chat over WebSocket.
    Connect with: ws://host/api/ws/support/{ticket_id}?token=<jwt>
    Send JSON: { "message": "..." }
    Receive JSON: { "message_id", "sender_type", "sender_id", "sender_name", "message", "sent_at" }
    """
    import jwt as pyjwt
    from config import settings

    # Authenticate via query-string token
    try:
        payload = pyjwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        uid = int(payload["sub"])
    except Exception:
        await websocket.close(code=4001)
        return

    # Determine sender type
    db = SessionLocal()
    try:
        admin_row = db.execute(
            text("SELECT admin_id FROM admins WHERE user_id = :uid"),
            {"uid": uid},
        ).first()
        sender_type = "ADMIN" if admin_row else "USER"

        # Get sender name
        name_row = db.execute(
            text("SELECT full_name FROM users WHERE user_id = :uid"),
            {"uid": uid},
        ).scalar()
        sender_name = name_row or "Unknown"

        # Verify ticket ownership — non-admin users can only join their own tickets
        if sender_type == "USER":
            ticket_owner = db.execute(
                text("SELECT user_id FROM support_tickets WHERE ticket_id = :tid"),
                {"tid": ticket_id},
            ).scalar()
            if ticket_owner is None or ticket_owner != uid:
                await websocket.close(code=4003)
                return
    finally:
        db.close()

    await manager.connect(ticket_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            msg_text = data.get("message", "").strip()
            if not msg_text:
                continue

            # Persist to DB
            db = SessionLocal()
            try:
                row = db.execute(
                    text("""
                        INSERT INTO support_messages (ticket_id, sender_type, sender_id, message)
                        VALUES (:tid, :st, :sid, :msg)
                        RETURNING message_id, sent_at
                    """),
                    {"tid": ticket_id, "st": sender_type, "sid": uid, "msg": msg_text},
                )
                db.commit()
                result = row.first()
                msg_id = result[0]
                sent_at = str(result[1])
            finally:
                db.close()

            # Broadcast to all connected clients in this ticket room
            await manager.broadcast(ticket_id, {
                "message_id": msg_id,
                "ticket_id": ticket_id,
                "sender_type": sender_type,
                "sender_id": uid,
                "sender_name": sender_name,
                "message": msg_text,
                "sent_at": sent_at,
            })

    except WebSocketDisconnect:
        manager.disconnect(ticket_id, websocket)
    except Exception:
        manager.disconnect(ticket_id, websocket)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fetch_messages(db: Session, ticket_id: int) -> list[MessageOut]:
    rows = db.execute(
        text("""
            SELECT sm.message_id, sm.ticket_id, sm.sender_type, sm.sender_id,
                   u.full_name, sm.message, sm.sent_at
            FROM support_messages sm
            JOIN users u ON u.user_id = sm.sender_id
            WHERE sm.ticket_id = :tid
            ORDER BY sm.sent_at ASC
        """),
        {"tid": ticket_id},
    ).all()
    return [
        MessageOut(
            message_id=r[0], ticket_id=r[1], sender_type=r[2],
            sender_id=r[3], sender_name=r[4], message=r[5], sent_at=str(r[6]),
        )
        for r in rows
    ]
