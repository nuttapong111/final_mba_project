#!/bin/bash

# Script สำหรับเตรียม push code ขึ้น GitHub

set -e

echo "🚀 เตรียม Push Code ขึ้น GitHub"
echo "================================"
echo ""

# ตรวจสอบ git status
echo "📋 ตรวจสอบไฟล์ที่จะ commit..."
git status --short

echo ""
echo "⚠️  ตรวจสอบไฟล์ที่สำคัญ:"
echo ""

# ตรวจสอบ .env files
if git ls-files | grep -q "\.env$"; then
  echo "❌ พบ .env files ที่จะถูก commit!"
  echo "   ควรลบออกจาก staging:"
  git ls-files | grep "\.env$" | while read file; do
    echo "     git restore --staged $file"
  done
else
  echo "✅ ไม่มี .env files ที่จะถูก commit"
fi

# ตรวจสอบ node_modules
if git ls-files | grep -q "node_modules/"; then
  echo "❌ พบ node_modules ที่จะถูก commit!"
  echo "   ควรลบออกจาก staging:"
  echo "     git restore --staged node_modules/"
else
  echo "✅ ไม่มี node_modules ที่จะถูก commit"
fi

# ตรวจสอบไฟล์ที่จำเป็น
echo ""
echo "📝 ไฟล์ที่ต้องมี:"
required_files=(
  "RAILWAY_DEPLOY.md"
  "backend/railway.json"
  "frontend/railway.json"
  ".railwayignore"
  ".gitignore"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (ไม่พบ)"
  fi
done

echo ""
echo "📦 คำสั่งที่ต้องรัน:"
echo ""
echo "1. เพิ่มไฟล์ทั้งหมด:"
echo "   git add ."
echo ""
echo "2. Commit:"
echo "   git commit -m 'feat: เพิ่ม Railway deployment configuration'"
echo ""
echo "3. เพิ่ม remote (ถ้ายังไม่มี):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
echo ""
echo "4. Push ขึ้น GitHub:"
echo "   git push -u origin main"
echo ""
echo "📚 ดูรายละเอียดเพิ่มเติมใน PREPARE_DEPLOY.md"


