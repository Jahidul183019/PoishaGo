 PoishaGo - Mobile Financial Service App



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
   uvicorn main:app --reload --port 8080
   # Runs on http://127.0.0.1:8080
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory: `cd frontend`
2. Install Node modules: `npm install`
3. Start the development server: `npm run dev`
4. Access the app via `http://localhost:5173`

