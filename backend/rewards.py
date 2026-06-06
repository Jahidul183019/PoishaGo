"""
routers/rewards.py
------------------
Loyalty points, redemption, leaderboard, tiers, and config.

Frontend pages:
  RewardsPage   → GET  /api/rewards/leaderboard
                → GET  /api/rewards/tiers
                → GET  /api/rewards/config
                → GET  /api/rewards/options
                → GET  /api/rewards/history
                → POST /api/rewards/redeem
  AdminConfigPage → POST   /api/admin/rewards/options
                  → DELETE /api/admin/rewards/options/{id}
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, get_current_admin, require_permission

router = APIRouter(prefix="/api", tags=["Rewards"])


# ── Pydantic models ───────────────────────────────────────────────────────────

class RedeemRequest(BaseModel):
    points: int
    bdt_value: float

class RewardOptionRequest(BaseModel):
    title: str
    points_required: int
    value_bdt: float
    category: str


# ── GET /api/rewards/leaderboard  (RewardsPage) ───────────────────────────────

@router.get("/rewards/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT u.full_name AS name, r.current_points AS points
                FROM reward_points r
                JOIN users u ON u.user_id = r.user_id
                ORDER BY r.current_points DESC
                LIMIT 10
            """)
        ).mappings().all()

    result = []
    medals = ["🥇", "🥈", "🥉"]
    for i, row in enumerate(rows):
        pts = row["points"]
        tier = (
            "platinum" if pts >= 15000 else
            "gold"     if pts >= 5000  else
            "silver"   if pts >= 1000  else
            "bronze"
        )
        result.append({
            "rank":   i + 1,
            "name":   row["name"],
            "points": pts,
            "tier":   tier,
            "medal":  medals[i] if i < 3 else "",
        })
    return result


# ── GET /api/rewards/tiers  (RewardsPage) ─────────────────────────────────────

# Tiers are static configuration — no DB table needed.
_REWARD_TIERS = [
    {
        "id":          "bronze",
        "name":        "Bronze",
        "threshold":   "0 – 999 pts",
        "description": "Earn 1x points on every transaction.",
        "colorStyle":  "orange",
        "borderClass": "border-orange-500/20",
        "bgClass":     "from-orange-500/10",
    },
    {
        "id":          "silver",
        "name":        "Silver",
        "threshold":   "1,000 – 4,999 pts",
        "description": "Earn 1.25x points and unlock priority support.",
        "colorStyle":  "slate",
        "borderClass": "border-slate-400/20",
        "bgClass":     "from-slate-400/10",
    },
    {
        "id":          "gold",
        "name":        "Gold",
        "threshold":   "5,000 – 14,999 pts",
        "description": "Earn 1.5x points and cashback on selected billers.",
        "colorStyle":  "yellow",
        "borderClass": "border-yellow-500/20",
        "bgClass":     "from-yellow-500/10",
    },
    {
        "id":          "platinum",
        "name":        "Platinum",
        "threshold":   "15,000+ pts",
        "description": "2x points, free cashouts, and exclusive campaigns.",
        "colorStyle":  "blue",
        "borderClass": "border-blue-400/20",
        "bgClass":     "from-blue-400/10",
    },
]

@router.get("/rewards/tiers")
def get_reward_tiers():
    return _REWARD_TIERS


# ── GET /api/rewards/config  (RewardsPage slider) ────────────────────────────

@router.get("/rewards/config")
def get_rewards_config():
    return {
        "conversion_rate": 0.10,
        "slider_min":      100,
        "slider_max":      5000,
        "slider_step":     100,
    }


@router.get("/rewards/options")
def get_reward_options(db: Session = Depends(get_db)):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(text("SELECT id, title, points_required as \"pointsRequired\", value_bdt as \"valueBDT\", category FROM reward_options ORDER BY points_required ASC")).mappings().all()
    return [dict(r) for r in rows]


# ── GET /api/rewards/history  (RewardsPage) ───────────────────────────────────

@router.get("/rewards/history")
def get_rewards_history(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with db.connection().engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    redemption_id                              AS id,
                    points_used                               AS points,
                    cashback_amount                           AS bdt,
                    to_char(redeemed_at, 'YYYY-MM-DD')        AS date
                FROM reward_redemptions
                WHERE user_id = :uid
                ORDER BY redeemed_at DESC
            """),
            {"uid": user_id},
        ).mappings().all()
    return [dict(r) for r in rows]


# ── POST /api/rewards/redeem  (RewardsPage) ───────────────────────────────────

@router.post("/rewards/redeem")
def redeem_rewards(
    req: RedeemRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Converts loyalty points to wallet BDT.
    Deducts points from reward_points, credits wallet balance,
    logs the redemption, and records a cashin transaction.
    """
    CONVERSION_RATE = 0.10

    with db.connection().engine.connect() as conn:
        # 1. Check user has enough points
        pts_row = conn.execute(
            text("SELECT current_points FROM reward_points WHERE user_id = :uid FOR UPDATE"),
            {"uid": user_id},
        ).first()

        if not pts_row or pts_row[0] < req.points:
            raise HTTPException(400, "Insufficient points.")

        # 2. Credit wallet
        wallet_row = conn.execute(
            text("""
                UPDATE wallets SET balance = balance + :bdt
                WHERE user_id = :uid
                RETURNING wallet_id
            """),
            {"bdt": req.bdt_value, "uid": user_id},
        ).first()
        if not wallet_row:
            raise HTTPException(404, "Wallet not found.")

        wallet_id = wallet_row[0]

        # 3. Deduct points
        res = conn.execute(
            text("""
                UPDATE reward_points
                SET current_points      = current_points - :pts,
                    lifetime_redeemed   = lifetime_redeemed + :pts,
                    updated_at          = now()
                WHERE user_id = :uid AND current_points >= :pts
                RETURNING current_points
            """),
            {"pts": req.points, "uid": user_id},
        ).first()

        # 4. Update Tier after deduction
        if res:
            new_pts = res[0]
            new_tier = "bronze"
            if new_pts >= 15000: new_tier = "platinum"
            elif new_pts >= 5000: new_tier = "gold"
            elif new_pts >= 1000: new_tier = "silver"
            
            conn.execute(
                text("UPDATE reward_points SET tier = :ntier WHERE user_id = :uid"),
                {"ntier": new_tier, "uid": user_id}
            )

        # 5. Log redemption
        conn.execute(
            text("""
                INSERT INTO reward_redemptions
                    (user_id, points_used, cashback_amount, conversion_rate, wallet_id, status)
                VALUES (:uid, :pts, :bdt, :rate, :wid, 'credited')
            """),
            {
                "uid": user_id, "pts": req.points,
                "bdt": req.bdt_value, "rate": CONVERSION_RATE, "wid": wallet_id,
            },
        )

        conn.commit()

    return {"message": "Points redeemed successfully", "bdt_added": req.bdt_value}


# ── Admin: POST /api/admin/rewards/options ────────────────────────────────────

@router.post("/admin/rewards/options")
def create_reward_option(
    req: RewardOptionRequest, 
    admin: dict = Depends(require_permission("MANAGE_CONFIG")),
    db: Session = Depends(get_db)
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO reward_options (title, points_required, value_bdt, category)
                VALUES (:title, :pts, :bdt, :cat)
            """),
            {"title": req.title, "pts": req.points_required, "bdt": req.value_bdt, "cat": req.category}
        )
        conn.commit()
    return {"message": "Reward option added"}


# ── Admin: DELETE /api/admin/rewards/options/{id} ────────────────────────────

@router.delete("/admin/rewards/options/{option_id}")
def delete_reward_option(
    option_id: int, 
    admin: dict = Depends(require_permission("MANAGE_CONFIG")),
    db: Session = Depends(get_db)
):
    with db.connection().engine.connect() as conn:
        conn.execute(
            text("DELETE FROM reward_options WHERE id = :id"),
            {"id": option_id}
        )
        conn.commit()
    return {"message": "Reward option deleted"}
