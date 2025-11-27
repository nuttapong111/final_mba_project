#!/bin/bash

# Script สำหรับตั้งค่า GitHub repository

set -e

echo "📦 ตั้งค่า GitHub Repository"
echo "============================"
echo ""

# ตรวจสอบว่ามี remote อยู่แล้วหรือไม่
if git remote -v | grep -q "origin"; then
  echo "✅ พบ remote repository:"
  git remote -v
  echo ""
  read -p "ต้องการเปลี่ยน remote URL หรือไม่? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "กรุณาใส่ GitHub repository URL: " repo_url
    git remote set-url origin "$repo_url"
    echo "✅ เปลี่ยน remote URL เป็น: $repo_url"
  fi
else
  echo "❌ ยังไม่มี remote repository"
  echo ""
  echo "กรุณาใส่ GitHub repository URL:"
  echo "ตัวอย่าง: https://github.com/username/repo-name.git"
  echo ""
  read -p "Repository URL: " repo_url
  
  if [ -z "$repo_url" ]; then
    echo "❌ ไม่ได้ใส่ URL"
    exit 1
  fi
  
  git remote add origin "$repo_url"
  echo "✅ เพิ่ม remote repository: $repo_url"
fi

echo ""
echo "📋 สรุป:"
echo "───────────────────────────────────────────────────────────"
git remote -v
echo ""

# ตรวจสอบ branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
  read -p "ต้องการเปลี่ยน branch เป็น 'main' หรือไม่? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -M main
    echo "✅ เปลี่ยน branch เป็น 'main'"
  fi
fi

echo ""
echo "🚀 พร้อม push แล้ว! ใช้คำสั่ง:"
echo "   git push -u origin main"
echo ""

