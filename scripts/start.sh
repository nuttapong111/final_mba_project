#!/bin/bash

# Start Script for LMS Platform
# This script starts PostgreSQL (if using Docker) and the application

set -e

echo "🚀 Starting LMS Platform..."

# Check if Docker is available
if command -v docker &> /dev/null; then
  echo "🐳 Checking Docker PostgreSQL..."
  
  # Check if docker-compose.yml exists
  if [ -f "docker-compose.yml" ]; then
    # Start PostgreSQL if not running
    if ! docker ps | grep -q lms_postgres; then
      echo "📦 Starting PostgreSQL container..."
      docker-compose up -d postgres
      
      # Wait for PostgreSQL to be ready
      echo "⏳ Waiting for PostgreSQL to be ready..."
      sleep 5
      
      # Check if PostgreSQL is ready
      for i in {1..30}; do
        if docker exec lms_postgres pg_isready -U postgres &> /dev/null; then
          echo "✅ PostgreSQL is ready!"
          break
        fi
        if [ $i -eq 30 ]; then
          echo "❌ PostgreSQL failed to start"
          exit 1
        fi
        sleep 1
      done
    else
      echo "✅ PostgreSQL container is already running"
    fi
  fi
else
  echo "ℹ️  Docker not found, assuming PostgreSQL is running locally"
fi

# Setup backend database
echo "🔧 Setting up backend database..."
cd backend
npm run db:setup
cd ..

echo "✅ All services are ready!"
echo ""
echo "📝 To start the application:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"

