#!/bin/bash

# Navigate to backend directory
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Initialize database with sample data
echo "Initializing database with sample data..."
npm run init-db

# Start the server
echo "Starting server..."
npm run dev 