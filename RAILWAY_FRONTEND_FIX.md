# 🔧 แก้ไขปัญหา Frontend ไม่มี Deploy Logs

## ❌ ปัญหาที่พบ

Frontend service ไม่มี deploy logs ใน Railway Dashboard

## 🔍 สาเหตุที่เป็นไปได้

1. **Frontend service ไม่ได้ถูกสร้างใน Railway**
   - มีแค่ backend service เท่านั้น
   - ต้องสร้าง frontend service แยก

2. **Frontend service ไม่ได้เชื่อมต่อกับ GitHub**
   - Service ไม่ได้ link กับ repository
   - ไม่ได้ trigger auto-deploy

3. **Root Directory ไม่ถูกต้อง**
   - Root Directory ไม่ได้ตั้งเป็น `frontend`
   - Railway ไม่รู้ว่าต้อง build จากไหน

4. **Build Configuration ไม่ถูกต้อง**
   - `railway.json` หรือ `nixpacks.toml` ไม่ถูกต้อง
   - Build command ไม่ทำงาน

5. **Service ไม่ได้ trigger deploy**
   - ไม่มี commit ใหม่
   - Manual deploy ไม่ได้ทำ

## ✅ วิธีแก้ไข

### 1. ตรวจสอบว่า Frontend Service มีอยู่หรือไม่

**ใน Railway Dashboard:**
1. ไปที่ Project → Architecture view
2. ดูว่ามี service ชื่อ `frontend` หรือไม่
3. ถ้าไม่มี → ต้องสร้างใหม่ (ดูขั้นตอนที่ 2)

**ถ้ามี service แต่ไม่มี logs:**
- ไปที่ Frontend service → Deploy Logs
- ดูว่ามี error หรือไม่
- ตรวจสอบ Build Logs

### 2. สร้าง Frontend Service (ถ้ายังไม่มี)

**ขั้นตอน:**

1. **ใน Railway Dashboard:**
   - คลิก **"+ New"** → **"GitHub Repo"**
   - เลือก repository: `nuttapong111/final_mba_project`
   - คลิก **"Deploy"**

2. **ตั้งค่า Service:**
   - **Service Name**: `frontend` (หรือ `lms-frontend`)
   - **Root Directory**: `frontend` ⚠️ **สำคัญมาก!**
   - **Branch**: `main` (หรือ branch ที่ต้องการ)

3. **ตรวจสอบ Build Configuration:**
   - Railway จะ detect `frontend/railway.json` อัตโนมัติ
   - หรือใช้ `frontend/nixpacks.toml`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

4. **ตั้งค่า Environment Variables:**
   - ไปที่ Frontend service → **Settings** → **Variables**
   - เพิ่ม:
     ```env
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app
     NODE_ENV=production
     ```

5. **Trigger Deploy:**
   - Railway จะ auto-deploy เมื่อสร้าง service
   - หรือคลิก **"Redeploy"** ใน Deployments tab

### 3. ตรวจสอบ Root Directory

**ถ้า Frontend service มีอยู่แล้ว:**

1. ไปที่ Frontend service → **Settings**
2. ดู **"Source"** section
3. ตรวจสอบ **"Root Directory"** = `frontend`
4. ถ้าไม่ใช่ → แก้ไขเป็น `frontend`
5. คลิก **"Save"**
6. Railway จะ trigger deploy ใหม่

### 4. ตรวจสอบ Build Configuration

**ตรวจสอบไฟล์:**

1. **`frontend/railway.json`** (ควรมี):
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && npm run build"
     },
     "deploy": {
       "startCommand": "npm run start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **`frontend/nixpacks.toml`** (ควรมี):
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs_20"]

   [phases.install]
   cmds = ["npm install"]

   [phases.build]
   cmds = ["npm run build"]

   [start]
   cmd = "npm run start"

   [variables]
   NODE_ENV = "production"
   ```

3. **`frontend/package.json`** (ตรวจสอบ scripts):
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

### 5. Trigger Manual Deploy

**ถ้า service มีอยู่แล้วแต่ไม่มี logs:**

1. ไปที่ Frontend service → **Deployments** tab
2. คลิก **"Redeploy"** หรือ **"Deploy"**
3. ตรวจสอบ Build Logs
4. ตรวจสอบ Deploy Logs

**หรือใช้ Railway CLI:**
```bash
railway up --service frontend
```

### 6. ตรวจสอบ GitHub Connection

**ถ้า service ไม่ได้ auto-deploy:**

1. ไปที่ Frontend service → **Settings** → **Source**
2. ตรวจสอบว่าเชื่อมต่อกับ GitHub repository
3. ตรวจสอบ Branch ที่เลือก
4. ถ้าไม่ได้เชื่อมต่อ → คลิก **"Connect GitHub"**

## 📋 Checklist

ก่อน deploy ตรวจสอบ:

- [ ] Frontend service ถูกสร้างใน Railway
- [ ] Root Directory = `frontend`
- [ ] เชื่อมต่อกับ GitHub repository
- [ ] `frontend/railway.json` มีอยู่
- [ ] `frontend/nixpacks.toml` มีอยู่
- [ ] `frontend/package.json` มี scripts ที่ถูกต้อง
- [ ] Environment variables ตั้งค่าแล้ว (`NEXT_PUBLIC_API_URL`)
- [ ] Build Logs แสดงผล
- [ ] Deploy Logs แสดงผล

## 🐛 Troubleshooting

### Frontend Service ไม่แสดงใน Architecture

**สาเหตุ:**
- Service ไม่ได้ถูกสร้าง
- Service ถูกลบ

**แก้ไข:**
- สร้าง service ใหม่ (ดูขั้นตอนที่ 2)

### Build Logs แสดง Error

**สาเหตุ:**
- Build command ไม่ทำงาน
- Dependencies ไม่ครบ
- TypeScript errors

**แก้ไข:**
1. ดู Build Logs → ดู error message
2. แก้ไขตาม error
3. Commit และ push ใหม่

### Deploy Logs แสดง "No logs"

**สาเหตุ:**
- Service ไม่ได้ start
- Start command ไม่ถูกต้อง
- Port configuration ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบ Start Command = `npm run start`
2. ตรวจสอบ `package.json` scripts
3. ตรวจสอบ Next.js configuration

### Frontend ไม่สามารถเรียก API

**สาเหตุ:**
- `NEXT_PUBLIC_API_URL` ไม่ถูกต้อง
- CORS ไม่ถูกต้อง

**แก้ไข:**
1. ตรวจสอบ `NEXT_PUBLIC_API_URL` = backend URL
2. ตรวจสอบ CORS settings ใน backend

## 🚀 Quick Fix

**ถ้า frontend service ไม่มีอยู่เลย:**

1. ไปที่ Railway Dashboard
2. คลิก **"+ New"** → **"GitHub Repo"**
3. เลือก `final_mba_project`
4. ตั้งค่า:
   - Service Name: `frontend`
   - Root Directory: `frontend`
5. คลิก **"Deploy"**
6. ตั้งค่า Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`
7. รอ deploy เสร็จ
8. ตรวจสอบ Deploy Logs

---

**Last Updated**: 2024

