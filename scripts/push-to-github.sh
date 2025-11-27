#!/bin/bash

# Script สำหรับ push code ไปยัง GitHub

set -e

REPO_URL="https://github.com/nuttapong111/final_mba_project.git"
SSH_URL="git@github.com:nuttapong111/final_mba_project.git"

echo "🚀 Push Code ไปยัง GitHub"
echo "========================="
echo ""

# ตรวจสอบ remote
current_remote=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$current_remote" ]; then
  echo "❌ ไม่พบ remote repository"
  echo "กำลังเพิ่ม remote..."
  git remote add origin "$REPO_URL"
elif [[ "$current_remote" == *"https"* ]]; then
  echo "📝 เปลี่ยน remote เป็น SSH (ง่ายกว่า authentication)"
  git remote set-url origin "$SSH_URL"
fi

echo "✅ Remote: $(git remote get-url origin)"
echo ""

# ตรวจสอบว่ามี commit หรือไม่
if ! git log -1 &>/dev/null; then
  echo "❌ ยังไม่มี commit"
  echo "กำลัง commit..."
  git add .
  git commit -m "feat: เพิ่ม Railway deployment configuration"
fi

# ตั้งค่า branch
git branch -M main

echo "📤 กำลัง push..."
echo ""

# ลอง push ด้วย SSH ก่อน
if git push -u origin main --force 2>&1; then
  echo ""
  echo "✅ Push สำเร็จ!"
  echo ""
  echo "🔗 Repository: https://github.com/nuttapong111/final_mba_project"
else
  echo ""
  echo "⚠️  Push ไม่สำเร็จ (อาจต้อง authentication)"
  echo ""
  echo "🔐 วิธีแก้:"
  echo "1. ใช้ Personal Access Token:"
  echo "   - ไปที่: https://github.com/settings/tokens"
  echo "   - สร้าง token ใหม่ (scope: repo)"
  echo "   - ใช้คำสั่ง:"
  echo "     git remote set-url origin https://github.com/nuttapong111/final_mba_project.git"
  echo "     git push -u origin main --force"
  echo "     (Username: nuttapong111, Password: ใส่ token)"
  echo ""
  echo "2. หรือใช้ SSH key:"
  echo "   - สร้าง SSH key: ssh-keygen -t ed25519 -C 'your_email@example.com'"
  echo "   - เพิ่ม key ไปที่ GitHub: https://github.com/settings/keys"
  echo "   - แล้วรัน script นี้อีกครั้ง"
fi

