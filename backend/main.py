"""
main.py
-------
PoishaGo FastAPI application entry point.

Router → Frontend page mapping
───────────────────────────────
auth_otp   → OTPPage (send-otp, verify-otp)
auth       → RegisterPage, LoginPage, AdminLoginPage, HomePage(/me), ProfilePage(/me)
transactions → SendMoneyPage, CashOutPage, CashInPage, BillPaymentPage,
               MobileRechargePage, TransactionHistoryPage,
               AdminDashboardPage, AdminDashboardPage(revenue-trend)
user       → SendMoneyPage(contacts), NotificationsPage,
               CashInPage/CashOutPage(agents), AdminUserTxnMgmtPage(users)
rewards    → RewardsPage, AdminConfigPage(reward options)
bills      → BillPaymentPage(providers)
admin      → AdminFraudDetectionPage(fraud-flags), AdminOccasionsPage(campaigns)
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from config import settings
import auth_otp, auth, transactions, user, rewards, bills, admin, support

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="PoishaGo Digital Wallet — Bangladesh",
    debug=settings.DEBUG,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://poisha-go.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Server Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

# ── Router registration ───────────────────────────────────────────────────────
# Order matters for overlapping paths: more specific routes first.
app.include_router(auth_otp.router)       # /api/send-otp, /api/verify-otp
app.include_router(auth.router)           # /api/register, /api/login, /api/me, /api/admin/login
app.include_router(transactions.router)   # /api/transactions/*, /api/recharge, /api/admin/transactions
app.include_router(user.router)           # /api/contacts, /api/notifications, /api/agents, /api/users
app.include_router(rewards.router)        # /api/rewards/*, /api/admin/rewards/*
app.include_router(bills.router)          # /api/bill/providers
app.include_router(admin.router)          # /api/fraud-flags, /api/campaigns
app.include_router(support.router)        # /api/support/*, /api/ws/support/*


# ── Health check ──────────────────────────────────────────────────────────────
@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    return {
        "status":    "online",
        "app":       settings.APP_NAME,
        "version":   "2.0.0",
        "db":        "connected",
    }
