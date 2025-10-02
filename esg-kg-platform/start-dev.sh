#!/bin/bash

# ESG Knowledge Graph Platform - Development Server Startup Script
# This script checks for occupied ports, kills existing processes, and starts both frontend and backend services

echo "🚀 Starting ESG Knowledge Graph Platform Development Servers"

# Function to kill process on specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "🔪 Killing processes on port $port: $pids"
        kill -9 $pids 2>/dev/null
        sleep 1
    else
        echo "✅ Port $port is available"
    fi
}

# Kill existing processes on ports 3000 and 3001
echo "📋 Checking and cleaning up ports..."
kill_port 3000
kill_port 3001

# Store current directory
PROJECT_ROOT=$(pwd)

# Start backend server in background
echo "🔧 Starting backend server on port 3000..."
cd "$PROJECT_ROOT/backend" && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend server in background  
echo "🎨 Starting frontend server on port 3001..."
cd "$PROJECT_ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

# Display status
echo ""
echo "🎉 Development servers started!"
echo "📍 Backend:  http://localhost:3000"
echo "📍 Frontend: http://localhost:3001"
echo ""
echo "💡 Press Ctrl+C to stop both servers"

# Keep script running and handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    kill_port 3000
    kill_port 3001
    echo "✅ Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for background processes
wait