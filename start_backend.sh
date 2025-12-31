#!/bin/bash
echo "Starting ClassFlow Backend Server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"

# Auto-load Azure credentials if present
if [ -f "backend/.env" ]; then
    echo "Loading environment variables from backend/.env..."
    export $(grep -v '^#' backend/.env | xargs)
fi

php -S localhost:8000 -t backend
