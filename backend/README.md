# PoishaGo Backend

This is the backend API for PoishaGo, a digital wallet and financial services application. The backend is built using **FastAPI (Python)** and uses **PostgreSQL** as its relational database.

## Features

- **User Authentication**: Registration and Login using phone numbers and PINs, secured with JWT (JSON Web Tokens) and bcrypt password hashing.
- **2FA OTP Verification**: Email-based OTP verification required for secure sign-ups AND all critical money-movement transactions.
- **Transactions**: Secure endpoints to send money, cash in, cash out, and pay bills. 
- **Mobile Recharge**: Supports mobile recharge across multiple operators (Grameenphone, Robi, Airtel, Banglalink, Teletalk).
- **Reward Points System**: Users can earn reward points for transactions, redeem them for balance, and view leaderboards.
- **Contact Management**: Users can add, view, and remove favorite contacts for quick transactions.
- **Admin & Agent Portals**: Endpoints dedicated to Admin overviews, system revenue monitoring, and agent-specific actions.

## Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT & Passlib (bcrypt)
- **Email Delivery**: SMTP (Gmail)
- **Environment Management**: python-dotenv

## Prerequisites

- Python 3.8+
- PostgreSQL
- Valid Gmail account for sending OTPs

## Setup Instructions

1. **Clone the repository and navigate to the backend directory.**

2. **Create a virtual environment and activate it:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables:**
   Create a `.env` file based on the `.env.example` file and configure your credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/poishago
   JWT_SECRET=your_jwt_secret_here
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```

5. **Database Setup:**
   Run the provided `schema.sql` and `indexes.sql` scripts to set up the database schema:
   ```bash
   psql -U your_username -d poishago -f schema.sql
   psql -U your_username -d poishago -f indexes.sql
   ```

6. **Run the API:**
   Start the FastAPI development server using Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8080
   ```
   The API will be accessible at `http://127.0.0.1:8080`. You can also view the interactive API documentation at `http://127.0.0.1:8080/docs`.

## Project Structure

- `main.py`: The entry point for the FastAPI application. Includes middleware and dependency setup.
- Route Files (`auth.py`, `transactions.py`, `admin.py`, `user.py`, etc.): Modularized API endpoints.
- `dependencies.py` & `security.py`: JWT authentication dependencies and bcrypt hashing utilities.
- `schema.sql`: Database schema definition for PostgreSQL.
- `indexes.sql`: Database indexes for performance optimization.
- `seed_fraud.py` & `run_fraud_engine.py`: Utilities for simulating and running the background fraud detection engine.
