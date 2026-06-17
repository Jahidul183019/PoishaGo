<div align="center">
  <img src="frontend/public/logo.png" alt="PoishaGo Logo" width="120" height="120" />
  <h1>PoishaGo</h1>
  <p><strong>A Next-Generation Mobile Financial Service (MFS) Platform</strong></p>


  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
</div>

---

## 📖 Overview

**PoishaGo** is a full-stack, state-of-the-art Mobile Financial Service (MFS) application engineered to deliver secure, lightning-fast, and deeply immersive digital banking experiences. Built to emulate and improve upon industry giants like bKash, PoishaGo offers peer-to-peer transfers, merchant payments, utility bill processing, and agent banking—all wrapped in a meticulously crafted, mobile-first UI.

## 🚀 Key Features

### 💸 Core Financial Suite
- **Send Money**: Instant peer-to-peer transfers with dynamic, server-controlled commission fees.
- **Agent Cash In & Out**: Secure deposit and withdrawal mechanics with verified agent networks.
- **Bill Payments**: Automated integration with utility providers, fully dynamic and fetched from the database.
- **Mobile Recharge**: Instant top-ups across all major telecommunication operators.
- **Dynamic Content Delivery**: Promotional banners, transaction fees, and reward configurations are completely database-driven via REST APIs, allowing real-time updates without app redeployments.

### 🛡️ Enterprise-Grade Security
- **Dual-Factor Authorization (2FA)**: All critical money-movement events are secured behind a 6-digit Wallet PIN and an asynchronous Email OTP check.
- **Automated Fraud Engine**: Background cron workers silently evaluate transaction velocity, frequency, and volume spikes, proactively isolating high-risk wallets.
- **Stateless Authentication**: Pure JWT-based session handling paired with bcrypt-hashed credentials.

### ✨ Premium User Experience
- **"Tap and Hold" Confirmation Slider**: A bespoke, highly responsive bottom-sheet slider modeled after industry-leading apps, providing satisfying tactile feedback for confirming transactions.
- **Flawless Layout Engine**: Custom React Portals ensure that overlays and modals intelligently break out of stacking contexts, perfectly accommodating iOS Safe Areas and bottom navigation bars.
- **Gamified Rewards System**: A dynamic, algorithmic points system that promotes users through Bronze, Silver, Gold, and Platinum tiers automatically based on their lifetime spend.

## 💻 Tech Stack

### Frontend (Client Application)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + Custom CSS variables for deep theming.
- **State Management**: Zustand (Global state)
- **Validation**: Zod + React Hook Form
- **Routing**: React Router DOM v6

### Backend (Core API)
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with raw parameterized SQL via SQLAlchemy Core.
- **Authentication**: PyJWT + Passlib
- **Email Delivery**: Asynchronous SMTP (Python `email` / `smtplib`)

## 🛠️ Local Development Setup

Follow these steps to run PoishaGo locally for development and testing.

### 1. Database Initialization
1. Ensure **PostgreSQL** is installed and running.
2. Create an empty database: `CREATE DATABASE poishago_db;`
3. Execute the schema files located in the backend folder:
   ```bash
   psql -U postgres -d poishago_db -f backend/schema.sql
   psql -U postgres -d poishago_db -f backend/indexes.sql
   ```
4. *Optional*: If you are upgrading an existing database, you can run the safe migration script:
   ```bash
   python backend/apply_schema_updates.py
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` configuration file based on the example:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost/poishago_db
   JWT_SECRET=your_highly_secure_jwt_secret_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_google_app_password
   ```
5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8080
   ```
   *The interactive API Docs (Swagger UI) will be available at [http://localhost:8080/docs](http://localhost:8080/docs).*

### 3. Frontend Setup
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web application at `http://localhost:3000`

### 4. Running Tests (Frontend)
PoishaGo uses Vitest and React Testing Library for frontend unit testing.
1. Navigate to the frontend directory: `cd frontend`
2. Run the test suite:
   ```bash
   npm run test:run
   ```
   *(Alternatively, execute the `./test.sh` bash script).*

---

### Contributors
- Maheru Tafannum
- MD.Jahidul Islam Sarker

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
