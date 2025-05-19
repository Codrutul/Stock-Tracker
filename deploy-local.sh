#!/bin/bash

echo "🔄 Building and deploying Stock Tracker application locally..."

# Create local network if it doesn't exist
docker network create stock-tracker-network 2>/dev/null || true

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down

# Build the images and start the containers
echo "🐳 Building Docker images and starting containers..."
docker-compose up -d --build

# Wait for the services to be ready
echo "⏳ Waiting for services to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
BACKEND_READY=false

# Check if backend is ready
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Checking backend health (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)..."
    
    if curl -s http://localhost:5001/api/ping > /dev/null; then
        BACKEND_READY=true
        echo "✅ Backend is ready!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep 2
done

# Get the URL of the application
FRONTEND_URL="http://localhost:80"
BACKEND_URL="http://localhost:5001"

if [ "$BACKEND_READY" = true ]; then
    echo "✅ Stock Tracker application deployed successfully!"
    echo "📊 Frontend URL: $FRONTEND_URL"
    echo "🔌 Backend URL: $BACKEND_URL"
    echo "🛠 API Health Check: $BACKEND_URL/api/ping"
else
    echo "❌ ERROR: Backend failed to start properly. Check the logs:"
    docker-compose logs backend
    echo ""
    echo "📋 Troubleshooting steps:"
    echo "  1. Check that port 5001 is not already in use"
    echo "  2. Ensure database.env has the correct configuration"
    echo "  3. Check for errors in the server.js file"
fi

# Print some useful commands
echo ""
echo "📋 Useful commands:"
echo "  docker-compose ps     - List all containers"
echo "  docker-compose logs   - View container logs"
echo "  docker-compose down   - Stop and remove containers"
echo "  docker-compose restart - Restart containers" 