#!/bin/bash
echo "Starting ClassFlow Backend Server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
php -S localhost:8000 -t backend
