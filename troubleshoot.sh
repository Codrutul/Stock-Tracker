#!/bin/bash

echo "🔍 Stock Tracker Backend Troubleshooting Tool"
echo "=============================================="

# Check if Docker is running
echo "Checking if Docker is running..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
else
  echo "✅ Docker is running"
fi

# Check if containers are running
echo "Checking Docker containers..."
BACKEND_CONTAINER=$(docker ps -q --filter "name=stock-tracker_backend" --filter "status=running")
POSTGRES_CONTAINER=$(docker ps -q --filter "name=stock-tracker_postgres" --filter "status=running")
FRONTEND_CONTAINER=$(docker ps -q --filter "name=stock-tracker_frontend" --filter "status=running")

# Print status of each container
echo ""
echo "Container Status:"
if [ -z "$BACKEND_CONTAINER" ]; then
  echo "❌ Backend container is not running"
else
  echo "✅ Backend container is running: $BACKEND_CONTAINER"
fi

if [ -z "$POSTGRES_CONTAINER" ]; then
  echo "❌ PostgreSQL container is not running"
else
  echo "✅ PostgreSQL container is running: $POSTGRES_CONTAINER"
fi

if [ -z "$FRONTEND_CONTAINER" ]; then
  echo "❌ Frontend container is not running"
else
  echo "✅ Frontend container is running: $FRONTEND_CONTAINER"
fi

# Check backend logs for errors if container exists
if [ ! -z "$BACKEND_CONTAINER" ]; then
  echo ""
  echo "Backend Container Logs (last 50 lines):"
  echo "---------------------------------------"
  docker logs --tail 50 $BACKEND_CONTAINER
fi

# Check if backend port is accessible
echo ""
echo "Checking backend connectivity..."
if nc -z localhost 5001 > /dev/null 2>&1; then
  echo "✅ Port 5001 is open and accessible"
else
  echo "❌ Cannot connect to port 5001"
  
  # Check if anything else is using port 5001
  PROCESS_USING_PORT=$(lsof -i :5001 -t 2>/dev/null)
  if [ ! -z "$PROCESS_USING_PORT" ]; then
    echo "⚠️ Another process is using port 5001: PID $PROCESS_USING_PORT"
    echo "   Consider terminating this process or changing the backend port"
  fi
fi

# Test database connection from inside the container
if [ ! -z "$BACKEND_CONTAINER" ]; then
  echo ""
  echo "Testing database connection from inside the backend container..."
  DB_TEST=$(docker exec $BACKEND_CONTAINER node -e "
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.log('❌ Database connection failed:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection successful:', res.rows[0].now);
      process.exit(0);
    }
  });" 2>&1)
  
  echo "$DB_TEST"
fi

# Print troubleshooting suggestions
echo ""
echo "🔧 Troubleshooting Suggestions:"
echo "------------------------------"
echo "1. Try restarting the containers: docker-compose down && docker-compose up -d"
echo "2. Check database.env has correct credentials: hostname should be 'postgres' not 'localhost'"
echo "3. Ensure no other services are using port 5001"
echo "4. Check for networking issues between containers: docker network inspect stock-tracker-network"
echo "5. Rebuild the backend image: docker-compose build backend"
echo ""
echo "For more detailed logs: docker-compose logs backend --tail=100" 