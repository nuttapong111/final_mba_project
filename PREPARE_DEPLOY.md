# 🚀 เตรียม Deploy บน Railway

## ✅ Checklist ก่อน Push ขึ้น GitHub

### 1. ตรวจสอบไฟล์ที่ต้อง Commit

```bash
git status
```

### 2. เพิ่มไฟล์ที่จำเป็น

ไฟล์ที่ต้อง commit:
- ✅ `RAILWAY_DEPLOY.md` - คู่มือการ deploy
- ✅ `backend/railway.json` - Backend Railway config
- ✅ `backend/nixpacks.toml` - Backend build config
- ✅ `backend/.env.example` - ตัวอย่าง environment variables
- ✅ `frontend/railway.json` - Frontend Railway config
- ✅ `frontend/nixpacks.toml` - Frontend build config
- ✅ `frontend/.env.example` - ตัวอย่าง environment variables
- ✅ `docker-compose.yml` - สำหรับ local development
- ✅ `scripts/` - Helper scripts
- ✅ `README.md` - อัพเดทแล้ว
- ✅ `.railwayignore` - Railway ignore file
- ✅ `.gitignore` - อัพเดทแล้ว

### 3. ไฟล์ที่ต้องไม่ Commit (อยู่ใน .gitignore)

- ❌ `.env` files
- ❌ `node_modules/`
- ❌ `dist/`, `build/`, `.next/`
- ❌ Database files (`.db`, `.sqlite`)

## 📝 คำสั่ง Git

### Step 1: เพิ่มไฟล์ทั้งหมด

```bash
# เพิ่มไฟล์ทั้งหมด
git add .

# หรือเพิ่มทีละไฟล์
git add RAILWAY_DEPLOY.md
git add backend/
git add frontend/
git add docker-compose.yml
git add scripts/
git add .railwayignore
git add .gitignore
git add README.md
```

### Step 2: Commit

```bash
git commit -m "feat: เพิ่ม Railway deployment configuration

- เพิ่ม Railway config files สำหรับ backend และ frontend
- เพิ่ม Nixpacks configuration
- เพิ่ม deployment documentation
- อัพเดท README และ .gitignore
- เพิ่ม helper scripts สำหรับ deployment"
```

### Step 3: สร้าง GitHub Repository (ถ้ายังไม่มี)

1. ไปที่ https://github.com
2. คลิก "New repository"
3. ตั้งชื่อ repository (เช่น `lms-platform`)
4. **อย่า** initialize with README (เพราะเรามีอยู่แล้ว)
5. คลิก "Create repository"

### Step 4: เพิ่ม Remote และ Push

```bash
# เพิ่ม remote repository (แทน YOUR_USERNAME และ YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# หรือใช้ SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git

# ตรวจสอบ remote
git remote -v

# Push ขึ้น GitHub
git branch -M main
git push -u origin main
```

### Step 5: ตรวจสอบบน GitHub

1. ไปที่ repository บน GitHub
2. ตรวจสอบว่ามีไฟล์ทั้งหมด
3. ตรวจสอบว่า `.env` files ไม่ถูก commit

## 🔐 Environment Variables ที่ต้องตั้งใน Railway

### Backend Service

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.railway.app
```

### Frontend Service

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## 🚂 Deploy บน Railway

หลังจาก push ขึ้น GitHub แล้ว:

1. ไปที่ https://railway.app
2. คลิก "New Project" → "Deploy from GitHub repo"
3. เลือก repository ที่เพิ่ง push
4. ทำตามขั้นตอนใน `RAILWAY_DEPLOY.md`

## ⚠️ หมายเหตุ

- **อย่า commit `.env` files** - ใช้ Railway environment variables แทน
- **ตรวจสอบ `.gitignore`** - ให้แน่ใจว่าไฟล์ sensitive ไม่ถูก commit
- **ใช้ `.env.example`** - สำหรับ reference เท่านั้น
- **Database URL** - Railway จะ inject อัตโนมัติจาก PostgreSQL service

## 🆘 Troubleshooting

### ถ้า push ไม่ได้

```bash
# Pull changes ก่อน (ถ้ามี)
git pull origin main --rebase

# Force push (ระวัง: ใช้เฉพาะเมื่อแน่ใจ)
git push -u origin main --force
```

### ถ้า remote มีอยู่แล้ว

```bash
# ตรวจสอบ remote
git remote -v

# เปลี่ยน remote URL
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### ถ้าต้องการสร้าง branch ใหม่

```bash
# สร้าง branch สำหรับ staging
git checkout -b staging

# Push branch
git push -u origin staging
```

---

**พร้อมแล้ว!** หลังจาก push ขึ้น GitHub แล้ว ให้ทำตามขั้นตอนใน `RAILWAY_DEPLOY.md` เพื่อ deploy บน Railway

