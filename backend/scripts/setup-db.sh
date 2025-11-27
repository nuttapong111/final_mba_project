#!/bin/bash

# Database Setup Script
# This script sets up the database schema and seeds initial data
# It checks if data exists before seeding to preserve existing data

set -e

echo "🔧 Setting up database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not found in environment, loading from .env file..."
  if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
  else
    echo "❌ Error: .env file not found"
    exit 1
  fi
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push schema to database (creates tables if they don't exist, preserves data)
echo "🗄️  Pushing database schema..."
npx prisma db push

# Check if database has users (to avoid re-seeding)
echo "🔍 Checking if database already has data..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM \"User\";" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "📊 Database is empty, seeding initial data..."
  npm run db:seed
else
  echo "✅ Database already has data ($USER_COUNT users found), skipping seed to preserve existing data"
  echo "💡 To re-seed, run: npm run db:seed"
fi

echo "✅ Database setup completed!"
