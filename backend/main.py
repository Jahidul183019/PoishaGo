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
bills      → BillPaymentPage(categories), AdminConfigPage(bill categories)
admin      → AdminFraudDetectionPage(fraud-flags), AdminOccasionsPage(campaigns)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
import auth_otp, auth, transactions, user, rewards, bills, admin

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="PoishaGo Digital Wallet — Bangladesh",
    debug=settings.DEBUG,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Tighten to specific origins in production
    allow_credentials=False,   # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router registration ───────────────────────────────────────────────────────
# Order matters for overlapping paths: more specific routes first.
app.include_router(auth_otp.router)       # /api/send-otp, /api/verify-otp
app.include_router(auth.router)           # /api/register, /api/login, /api/me, /api/admin/login
app.include_router(transactions.router)   # /api/transactions/*, /api/recharge, /api/admin/transactions
app.include_router(user.router)           # /api/contacts, /api/notifications, /api/agents, /api/users
app.include_router(rewards.router)        # /api/rewards/*, /api/admin/rewards/*
app.include_router(bills.router)          # /api/bill/categories, /api/admin/bill/categories
app.include_router(admin.router)          # /api/fraud-flags, /api/campaigns


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {
        "status":    "online",
        "app":       settings.APP_NAME,
        "version":   "2.0.0",
        "db":        "connected",
    }
