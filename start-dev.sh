#!/bin/bash

echo "Starting backend and frontend in development mode..."

# Start backend
echo "Starting backend server..."
cd server
PORT=5001 npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting frontend development server..."
cd client
npm start &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Access frontend at http://localhost:3000"
echo "Access backend API at http://localhost:5001/api"
echo "To stop both servers, run: kill $BACKEND_PID $FRONTEND_PID"

wait $BACKEND_PID
wait $FRONTEND_PID
