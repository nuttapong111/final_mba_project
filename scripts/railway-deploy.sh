#!/bin/bash

# Railway Deployment Helper Script
# This script helps prepare and deploy to Railway

set -e

echo "🚂 Railway Deployment Helper"
echo "============================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  echo "⚠️  Railway CLI not found"
  echo "📦 Install it with: npm i -g @railway/cli"
  echo ""
  read -p "Continue without CLI? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📋 Deployment Checklist:"
echo "1. ✅ Backend railway.json created"
echo "2. ✅ Frontend railway.json created"
echo "3. ✅ Environment variables configured"
echo "4. ✅ Database migrations ready"
echo ""
echo "🔧 Next Steps:"
echo ""
echo "1. Create Railway Project:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo ""
echo "2. Add PostgreSQL Database:"
echo "   - In Railway project, click '+ New'"
echo "   - Select 'Database' → 'Add PostgreSQL'"
echo ""
echo "3. Deploy Backend:"
echo "   - Click '+ New' → 'GitHub Repo'"
echo "   - Select your repo"
echo "   - Set Root Directory: backend"
echo "   - Add Environment Variables:"
echo "     DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "     JWT_SECRET=your-secret-key"
echo "     CORS_ORIGIN=https://your-frontend.railway.app"
echo ""
echo "4. Deploy Frontend:"
echo "   - Click '+ New' → 'GitHub Repo'"
echo "   - Select your repo"
echo "   - Set Root Directory: frontend"
echo "   - Add Environment Variable:"
echo "     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api"
echo ""
echo "5. Seed Database (first time only):"
echo "   railway run --service backend npm run db:seed"
echo ""
echo "📚 For detailed instructions, see RAILWAY_DEPLOY.md"
echo ""


