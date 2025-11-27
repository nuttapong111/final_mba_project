# 🔧 แก้ไข Railway Build Error

## ❌ ปัญหาที่พบ

```
✖ Railpack could not determine how to build the app.
▲ Script start.sh not found
```

**สาเหตุ**: Railway ไม่สามารถ detect โครงสร้างโปรเจคได้ เพราะเป็น **monorepo** (มี backend และ frontend ใน root)

## ✅ วิธีแก้ไข

### วิธีที่ 1: ตั้งค่า Root Directory ใน Railway (แนะนำ)

1. **ใน Railway Dashboard**:
   - ไปที่ Service ที่สร้างไว้
   - คลิก **Settings** → **Source**
   - ตั้งค่า **Root Directory**:
     - **Backend service**: `backend`
     - **Frontend service**: `frontend`

2. **Redeploy**:
   - คลิก **Deploy** → **Redeploy**

### วิธีที่ 2: สร้าง Services แยกกัน

#### สร้าง Backend Service

1. ใน Railway project → คลิก **"+ New"** → **"GitHub Repo"**
2. เลือก repository: `nuttapong111/final_mba_project`
3. ตั้งค่า:
   - **Service Name**: `backend` (หรือ `lms-backend`)
   - **Root Directory**: `backend` ⚠️ **สำคัญมาก!**
   - **Build Command**: (จะใช้จาก `backend/railway.json` อัตโนมัติ)
   - **Start Command**: (จะใช้จาก `backend/railway.json` อัตโนมัติ)

4. **Environment Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.railway.app
   ```

#### สร้าง Frontend Service

1. ใน Railway project → คลิก **"+ New"** → **"GitHub Repo"**
2. เลือก repository: `nuttapong111/final_mba_project` (เดียวกัน)
3. ตั้งค่า:
   - **Service Name**: `frontend` (หรือ `lms-frontend`)
   - **Root Directory**: `frontend` ⚠️ **สำคัญมาก!**
   - **Build Command**: (จะใช้จาก `frontend/railway.json` อัตโนมัติ)
   - **Start Command**: (จะใช้จาก `frontend/railway.json` อัตโนมัติ)

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

### วิธีที่ 3: ใช้ Railway CLI

```bash
# ติดตั้ง Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# สร้าง service สำหรับ backend
railway service create backend
railway service use backend
railway variables set ROOT_DIR=backend

# สร้าง service สำหรับ frontend
railway service create frontend
railway service use frontend
railway variables set ROOT_DIR=frontend
```

## 📝 Checklist

- [ ] สร้าง Backend service พร้อม Root Directory = `backend`
- [ ] สร้าง Frontend service พร้อม Root Directory = `frontend`
- [ ] ตั้งค่า Environment Variables สำหรับ Backend
- [ ] ตั้งค่า Environment Variables สำหรับ Frontend
- [ ] เพิ่ม PostgreSQL Database
- [ ] เชื่อมต่อ Backend กับ Database
- [ ] Seed database (ครั้งแรก): `railway run --service backend npm run db:seed`

## 🔍 ตรวจสอบ

หลังจากตั้งค่า Root Directory แล้ว:

1. **Backend Service**:
   - ควรเห็น build logs ที่เริ่มจาก `backend/` directory
   - ควรเห็น `npm install` ใน `backend/` directory
   - ควร build สำเร็จ

2. **Frontend Service**:
   - ควรเห็น build logs ที่เริ่มจาก `frontend/` directory
   - ควรเห็น `npm install` ใน `frontend/` directory
   - ควร build สำเร็จ

## ⚠️ ข้อผิดพลาดที่พบบ่อย

### Error: "Railpack could not determine how to build"
- **แก้**: ตั้งค่า Root Directory ใน service settings

### Error: "Cannot find module"
- **แก้**: ตรวจสอบว่า Root Directory ถูกต้อง

### Error: "Database connection failed"
- **แก้**: ตรวจสอบ `DATABASE_URL` environment variable

## 📚 อ้างอิง

- [Railway Monorepo Guide](https://docs.railway.app/guides/monorepo)
- [Railway Root Directory](https://docs.railway.app/develop/root-directory)


