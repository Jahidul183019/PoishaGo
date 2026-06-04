# PoishaGo - Mobile Financial Service App

PoishaGo is a modern, high-performance web application designed to emulate the core functionalities of Mobile Financial Services (MFS) like bKash or Nagad. It offers a sleek, dynamic user interface paired with a robust backend architecture.

## 🚀 Features

### User Features
- **User Authentication:** Secure Registration, Login, and Email OTP Verification.
- **Dashboard:** Interactive dashboard with balance toggling and dynamic service grids.
- **Transactions:** 
  - **Send Money:** Instantly transfer funds to registered users.
  - **Cash In / Cash Out:** Simulate deposits and withdrawals from agent stores.
  - **Mobile Recharge:** Top-up any mobile operator (GP, Robi, Airtel, Banglalink, Teletalk).
  - **Bill Payment:** Pay utility bills directly from your wallet.
- **Favorite Contacts:** Manually add, manage, and remove favorite contacts for quick access during transactions.
- **Rewards System:** Earn points, view dynamic reward tiers, check leaderboards, and redeem points for cashback directly into your wallet.
- **Transaction History:** Detailed chronological ledger of all account activities.

### Admin Features
- **Admin Dashboard:** Centralized view of system performance.
- **Configuration Management:** Dynamically add and update "Reward Options" and "Bill Categories" which immediately reflect in the user app.
- **Fraud Monitoring:** View system-generated fraud flags and suspicious activities based on transactional rules.
- **Campaigns:** Manage promotional cashbacks and bonus campaigns.

## 💻 Tech Stack

### Frontend
- **React 18** with **Vite** for blazing fast performance.
- **TypeScript** for type safety and robust development.
- **Tailwind CSS** for beautiful, responsive, and dynamic UI styling.
- **Lucide React** for crisp, modern icons.
- **Zustand / Context** (Custom implementations) for state management.
- **React Router** for seamless single-page application navigation.

### Backend
- **FastAPI (Python):** High-performance backend framework.
- **PostgreSQL:** Reliable relational database for transactional integrity.
- **JWT (JSON Web Tokens):** Secure authentication and route protection.
- **Passlib & Bcrypt:** Secure password hashing.
- **smtplib:** Integrated Email OTP delivery.

## 🛠️ Project Structure

```
PoishaGo
├── frontend/             # React (Vite) Application
│   ├── src/
│   │   ├── components/   # Reusable UI components (Modals, Icons, etc.)
│   │   ├── pages/        # Main route components (Home, SendMoney, Rewards, Admin, etc.)
│   │   ├── services/     # API integration (api.ts)
│   │   └── App.tsx       # Route definitions
│   └── package.json
├── backend/              # FastAPI Application
│   ├── main.py           # Core backend endpoints and logic
│   ├── db_schema.sql     # Database initialization schema
│   ├── .env              # Environment variables (DB URL, JWT Secret, etc.)
│   └── requirements.txt  # Python dependencies
└── README.md
```

## ⚙️ Local Development Setup

### 1. Database Setup
1. Install and run PostgreSQL.
2. Create a database (e.g., `poishago_db`).
3. Run the SQL schema provided in `backend/db_schema.sql` to initialize tables.

### 2. Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Create a virtual environment: `python3 -m venv venv`
3. Activate the virtual environment: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file in the `backend` folder based on `.env.example`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/poishago_db
   JWT_SECRET=your_super_secret_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```
6. Run the FastAPI server:
   ```bash
   python3 main.py
   # Runs on http://0.0.0.0:8000
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install Node modules: `npm install`
3. Start the development server: `npm run dev`
4. Access the app via `http://localhost:5173`

## 🛡️ Architecture & Security
- **Atomic Transactions:** Uses PostgreSQL transaction blocks (`conn.commit()` and `conn.rollback()`) to ensure no funds are lost or duplicated during concurrent transfers.
- **System Wallets:** Special master accounts (`BILL_SYSTEM`, `RECHARGE_SYSTEM`) act as financial sinks for utility and operator payments.
- **Input Validation:** Thorough backend checks (e.g., balance sufficiency, PIN verification, valid operators, positive amounts).

---
*Built with modern web technologies.*
