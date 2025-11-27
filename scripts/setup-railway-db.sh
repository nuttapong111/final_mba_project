#!/bin/bash

# Script สำหรับ setup database บน Railway

set -e

# Railway Database URL
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:ztrySoeoLpWyoNjZMEVUkQsqMTXXYpne@turntable.proxy.rlwy.net:54572/railway}"

echo "🚀 Setup Railway Database"
echo "========================"
echo ""

# ตรวจสอบ DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  echo "Usage: DATABASE_URL='your-connection-string' ./scripts/setup-railway-db.sh"
  exit 1
fi

export DATABASE_URL

echo "📦 Generating Prisma Client..."
cd "$(dirname "$0")/../backend"
npx prisma generate

echo ""
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

echo ""
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Database setup completed!"
echo ""
echo "📊 ตรวจสอบข้อมูล:"
echo "   - Users: $(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo 'N/A')"
echo "   - Schools: $(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"School\";" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo 'N/A')"
echo "   - Courses: $(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Course\";" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo 'N/A')"

