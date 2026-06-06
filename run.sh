#!/bin/bash

echo "Starting PoishaGo Application..."

# Kill any existing processes on the ports we need
echo "Checking for existing processes on ports 8080 and 5173..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend (FastAPI on port 8080)..."
cd backend
# Make sure to run with the venv python
./venv/bin/python -m uvicorn main:app --reload --env-file .env --port 8080 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend (Vite on port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Both servers are running!"
echo "Backend PID: $BACKEND_PID (http://localhost:8080)"
echo "Frontend PID: $FRONTEND_PID (http://localhost:5173)"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both background processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep the script running to catch Ctrl+C
wait
