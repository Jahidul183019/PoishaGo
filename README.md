<div align="center">

<img src="frontend/public/logo.png" alt="PoishaGo Logo" width="100" height="100" />

# PoishaGo
### *Send it. Track it. Trust it.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <strong>A full-stack Mobile Financial Service (digital wallet) platform for Bangladesh</strong><br>
  <em>React dashboard + FastAPI backend + PostgreSQL database sharing one relational source of truth</em>
</p>

---

</div>

## Team

**CSE-2201 DBMS Lab Group**

| # | Member |
|---|--------|
| 1 | Md. Jahidul Islam Sarker |
| 2 | Maheru Tafannum |

## Project Links

| Service | URL |
|---------|-----|
| Live App | [https://poisha-go.vercel.app](https://poisha-go.vercel.app) |
| Demo Video | [https://youtu.be/awSXqrr5GCM?si=JjkWrgGme4-V84wp](https://youtu.be/awSXqrr5GCM?si=JjkWrgGme4-V84wp) |
| Backend API | Render-hosted (see deployment config) |
| Database | Supabase (PostgreSQL) |
| GitHub Repo | [https://github.com/Jahidul183019/PoishaGo](https://github.com/Jahidul183019/PoishaGo) |
| Course | CSE-2201, Database Management System — University of Dhaka |

## Project Highlights

- **20-table relational schema**: covers users, wallets, transactions, fraud detection, rewards, admin RBAC, and support — all proven to satisfy BCNF.
- **Real-time fraud detection engine**: 5 rule-based checks (large transaction, rapid-fire pattern, unusual hours, new-account activity, geographic anomaly) with configurable risk scores.
- **Tiered loyalty rewards**: Bronze → Silver → Gold → Platinum, with automatic tier upgrades and multiplier-based point accrual on every transaction.
- **4-role admin RBAC**: SUPER_ADMIN, FINANCE_ADMIN, RISK_MANAGER, and SUPPORT, each with a distinct permission matrix enforced at the API layer.
- **Dual-factor money movement**: every transfer, cash-out, and bill payment requires both a wallet PIN and a time-boxed email OTP.
- **Festival cashback campaigns**: date-bounded, transaction-type-specific promotional cashback (Eid, Bengali New Year, Independence Day, and more).
- **Live support chat**: WebSocket-powered real-time messaging between users and admins, backed by persisted ticket history.
- **Deployed and live**: React frontend on Vercel, FastAPI backend on Render, PostgreSQL on Supabase — not just a local prototype.

## Introduction

PoishaGo is a full-stack, state-of-the-art Mobile Financial Service (MFS) application engineered to deliver secure, lightning-fast, and deeply immersive digital banking experiences. Built to emulate and improve upon industry giants like bKash, PoishaGo offers peer-to-peer transfers, merchant payments, utility bill processing, and agent banking—all wrapped in a meticulously crafted, mobile-first UI.

### Key Objectives

| Objective | Description |
|-----------|-------------|
| **Relational Integrity** | Model an MFS domain across 20 normalized tables with full constraint coverage (PK, FK, UNIQUE, CHECK, NOT NULL). |
| **Secure Transactions** | Enforce PIN + OTP dual-factor authorization on every money-movement action. |
| **Fraud Awareness** | Detect and flag suspicious transaction patterns in near real time via rule-based scoring. |
| **User Engagement** | Reward transaction activity through a tiered, points-based loyalty system. |
| **Administrative Control** | Give operations staff role-scoped dashboards for transactions, fraud review, and support. |
| **Live Deployment** | Ship a working, publicly accessible product, not just a local demo. |

---

## Key Features

<table>
<tr>
<td width="50%">

### Core Financial Suite

- Peer-to-peer money transfers with dynamic, server-controlled fees
- Agent-mediated cash-in and cash-out
- Utility bill payments (electricity, water, gas, internet, education, TV)
- Mobile recharge across major Bangladeshi operators
- Favorite contacts with fee waivers for frequent recipients

</td>
<td width="50%">

### Security & Compliance

- JWT-based stateless authentication with bcrypt-hashed PINs
- Email OTP verification for registration, login reset, and transfers
- Real-time fraud engine with 5 configurable detection rules
- Full audit log of admin actions with before/after JSONB snapshots
- Role-scoped admin permissions enforced per endpoint

</td>
</tr>
<tr>
<td width="50%">

### Rewards & Engagement

- Points earned automatically on every successful transaction
- Four-tier loyalty system with increasing point multipliers
- Point redemption for wallet cashback and partner vouchers
- Festival/occasion cashback campaigns with eligibility windows
- In-app, SMS, and email notification channels

</td>
<td width="50%">

### Admin Operations

- Live transaction and revenue dashboards
- Fraud flag review queue with risk-score sorting
- Occasion/campaign configuration console
- User and wallet management tools
- WebSocket-powered live support chat with users

</td>
</tr>
</table>

---

## System Architecture

<div align="center">
  <img src="docs/schema-diagram.png" alt="PoishaGo full database schema — all 20 tables" width="100%" style="max-width:960px;border:1px solid #e4e8f2;border-radius:8px;">
  <p><em>Full schema diagram — all 20 tables with column-level detail</em></p>
</div>

The full schema and entity-relationship diagrams are maintained alongside the lab report; see [backend/schema.sql](backend/schema.sql) for the authoritative DDL.

### Data Flow

1. The frontend authenticates via [frontend/src/store/useAuthStore.ts](frontend/src/store/useAuthStore.ts) and attaches the JWT to every request through [frontend/src/utils/api.ts](frontend/src/utils/api.ts).
2. Every protected backend route validates the token through `get_current_user` in [backend/dependencies.py](backend/dependencies.py).
3. Money-movement requests are validated (PIN, OTP, balance, limits) and executed atomically in [backend/transactions.py](backend/transactions.py).
4. Each successful transaction is evaluated against fraud rules in [backend/run_fraud_engine.py](backend/run_fraud_engine.py) and flagged into `fraud_flags` when a rule triggers.
5. Reward points, tier upgrades, and occasion cashback are recalculated inline as part of the same transaction in `transactions.py`.
6. Admin routes in [backend/admin.py](backend/admin.py) enforce per-permission access via `require_permission` before touching any operational data.
7. Live support messages flow over the WebSocket endpoint in [backend/support.py](backend/support.py), broadcast to both the user and any connected admin.

---

## Database Design

- **20 tables** spanning users, wallets, transactions, OTP verification, transaction limits, admin RBAC, fraud detection, bill payments, bill providers, audit logs, notifications, rewards, occasion cashbacks, promotional banners, favorite contacts, and support tickets.
- Full DDL lives in [backend/schema.sql](backend/schema.sql); supporting indexes in [backend/indexes.sql](backend/indexes.sql).
- Every table is proven to satisfy BCNF with documented non-trivial functional dependencies — see the full DBMS lab report for the complete normalization proof, ER diagram, and 27 sample queries covering joins, subqueries, set operations, views, and aggregate functions.

<div align="center">
  <img src="docs/er-diagram.png" alt="PoishaGo entity-relationship diagram" width="100%" style="max-width:1100px;border:1px solid #e4e8f2;border-radius:8px;background-color:white;">
  <p><em>Entity-Relationship Diagram — 20 entities connected through primary and foreign keys</em></p>
</div>

---

## Tech Stack

| Layer | Technologies |
|:------|:-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router DOM v6, Zod + React Hook Form, Lucide React |
| **Backend** | FastAPI (Python 3.10+), SQLAlchemy Core, PyJWT, Passlib + bcrypt, WebSockets |
| **Database** | PostgreSQL (raw parameterized SQL, no ORM abstraction over the schema) |
| **Email / OTP** | Brevo transactional email API |
| **Deployment** | Vercel (frontend), Render (backend), Supabase (database) |

---

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL (local instance, or a Supabase project)
- A Brevo API key for OTP email delivery — optional in development; OTPs are printed to the console if unset

### Quick Start

From the project root:

```bash
cp backend/.env.example backend/.env
./run.sh
```

This starts both servers together:

- Backend: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- Frontend: `http://localhost:5173`

### Run Services Individually

Backend:

```bash
cd backend
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --env-file .env --port 8080
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Configuration

Copy [backend/.env.example](backend/.env.example) to `backend/.env` and fill in your values:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Security
JWT_SECRET=your_super_secret_key_at_least_32_characters_long

# Email / Brevo (OTP delivery)
BREVO_API_KEY=xkeysib-your-key-here
SENDER_EMAIL=your_verified_sender_email@example.com
```



---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register` | POST | Create a new user account and dispatch a registration OTP |
| `/api/login` | POST | Authenticate via phone + PIN, returns a JWT |
| `/api/admin/login` | POST | Authenticate an admin account, returns JWT + role + permissions |
| `/api/verify-otp` | POST | Validate a 6-digit OTP for registration, login reset, or transfer |
| `/api/me` | GET | Fetch the authenticated user's profile, wallet, and reward status |
| `/api/transactions/send` | POST | Peer-to-peer money transfer |
| `/api/transactions/cashout` | POST | Agent-mediated cash-out |
| `/api/transactions/cashin` | POST | Agent-mediated cash-in |
| `/api/transactions/bill` | POST | Utility bill payment |
| `/api/recharge` | POST | Mobile recharge |
| `/api/transactions` | GET | Transaction history for the authenticated user |
| `/api/admin/transactions` | GET | All transactions (admin, permission-gated) |
| `/api/admin/fraud-flags` | GET | Fraud review queue sorted by risk score |
| `/api/support/tickets` | GET / POST | List or create support tickets |
| `/api/ws/support/{ticket_id}` | WebSocket | Real-time support chat |

Support chat WebSocket message format:

```json
{
  "message": "Hi, I need help with a failed transfer."
}
```

---

## Project Structure

```text
PoishaGo/
├── backend/                       # FastAPI application
│   ├── main.py                    # App entrypoint, CORS, router registration
│   ├── auth.py                    # Registration, login, profile, PIN management
│   ├── auth_otp.py                # OTP generation, email dispatch, verification
│   ├── transactions.py            # Send/cash-in/cash-out/bill — the core money-movement logic
│   ├── rewards.py                 # Points accrual, tier upgrades, redemptions
│   ├── bills.py                   # Bill provider listings
│   ├── admin.py                   # Admin dashboards, RBAC-gated operational routes
│   ├── support.py                 # Support tickets + WebSocket live chat
│   ├── user.py                    # Contacts, notifications, agent listings
│   ├── database.py                # SQLAlchemy engine/session setup
│   ├── security.py                # bcrypt PIN hashing helpers
│   ├── dependencies.py            # JWT auth, admin RBAC dependencies
│   ├── config.py                  # Environment-driven settings
│   ├── schema.sql                 # Full DDL — 20 tables, views, seed data
│   ├── indexes.sql                # Performance indexes
│   └── run_fraud_engine.py        # Rule-based fraud detection queries
├── frontend/
│   ├── src/
│   │   ├── pages/user/            # SendMoney, CashIn/Out, BillPayment, Rewards, etc.
│   │   ├── pages/admin/           # AdminDashboard, FraudDetection, Occasions, Support
│   │   ├── components/            # Shared UI, layout, and form components
│   │   ├── store/                 # Zustand stores (auth, wallet, theme)
│   │   └── utils/                 # API client, validators, formatters
│   └── package.json
├── docs/                          # Schema and ER diagrams (referenced by this README)
├── run.sh                         # Starts backend + frontend together
└── README.md
```

---

## Demo Flow

1. Register a new account and complete email OTP verification.
2. Log in and send money to a favorite contact — note the waived transfer fee.
3. Send a large transaction to trigger a fraud rule (e.g., above the configured threshold).
4. Log in as an admin and review the flagged transaction in the fraud dashboard.
5. Return to the user account and confirm the reward-points update and any tier change.
6. Open a support ticket as the user, then respond live as the admin over the WebSocket chat.



## Additional Documentation

- [Complete DBMS Lab Report](docs/PoishaGo_Report.pdf) — schema description, ER/schema diagrams, 27 sample queries with relational algebra, view definitions, and normal-form proofs for all 20 tables
- [backend/schema.sql](backend/schema.sql) — authoritative DDL and seed data
- [backend/indexes.sql](backend/indexes.sql) — indexing strategy

---

## Future Scope

- **Multi-currency support** — extend wallets and transactions beyond BDT with exchange-rate tracking.
- **ML-based fraud scoring** — replace static rule thresholds with a trained model using transaction patterns.
- **Table partitioning for transactions at scale** — partition by date to keep performance stable as volume grows.
- **Rate limiting on auth/OTP endpoints** — add brute-force protection for login and verification.
