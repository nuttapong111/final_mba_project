# 🐛 Railway Troubleshooting Guide

## ปัญหา 502 Bad Gateway

### สาเหตุที่เป็นไปได้

1. **Backend service ไม่ได้รัน**
   - Service crash หลัง start
   - Build fail
   - Missing dependencies

2. **Port Configuration Issues**
   - Backend ไม่ได้ listen ที่ port ที่ Railway กำหนด
   - PORT environment variable ไม่ถูกต้อง

3. **Database Connection Issues**
   - DATABASE_URL ไม่ถูกต้อง
   - Database service ไม่ได้รัน
   - Network connectivity issues

4. **Environment Variables Missing**
   - JWT_SECRET ไม่ได้ตั้งค่า
   - CORS_ORIGIN ไม่ถูกต้อง
   - DATABASE_URL ไม่ได้ตั้งค่า

5. **Build Errors**
   - TypeScript compilation errors
   - Missing files
   - Dependencies issues

## 🔍 วิธีตรวจสอบและแก้ไข

### 1. ตรวจสอบ Build Logs

ใน Railway Dashboard:
1. ไปที่ service `final_mba_project`
2. คลิก tab **"Build Logs"**
3. ตรวจสอบว่ามี errors หรือไม่

**สิ่งที่ต้องดู:**
- ✅ `npm install` สำเร็จ
- ✅ `npm run build` สำเร็จ (ไม่มี TypeScript errors)
- ✅ `npx prisma generate` สำเร็จ

### 2. ตรวจสอบ Deploy Logs

ใน Railway Dashboard:
1. คลิก tab **"Deploy Logs"**
2. ดู logs หลัง deploy

**สิ่งที่ต้องดู:**
- ✅ `🚀 Server is running on port XXXX`
- ✅ `📊 Environment: production`
- ❌ Error messages (เช่น database connection errors)

**ตัวอย่าง Error ที่พบบ่อย:**
```
Error: Can't reach database server
PrismaClientInitializationError
```

### 3. ตรวจสอบ Environment Variables

ใน Railway Dashboard:
1. ไปที่ **Settings** → **Variables**
2. ตรวจสอบว่ามี variables ต่อไปนี้:

**Backend Service Variables:**
```bash
DATABASE_URL=postgresql://... (จาก Postgres service)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.railway.app
PORT=XXXX (Railway จะ set อัตโนมัติ)
NODE_ENV=production
```

**Frontend Service Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 4. ตรวจสอบ Database Connection

**วิธีตรวจสอบ:**
1. ตรวจสอบว่า Postgres service รันอยู่ (Status: Active)
2. ตรวจสอบ DATABASE_URL ใน Backend service:
   - ไปที่ Postgres service → **Connect** → **Postgres Connection URL**
   - Copy URL และตั้งค่าใน Backend service variables

**ทดสอบ Database Connection:**
```bash
# ใน Railway CLI หรือ Deploy Logs
npx prisma db push
```

### 5. ตรวจสอบ Health Check

**ทดสอบ Backend Health:**
```bash
curl https://finalmbaproject-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

**ถ้าได้ 502:**
- Backend service ไม่ได้รัน
- ตรวจสอบ Deploy Logs

### 6. ตรวจสอบ Service Status

ใน Railway Dashboard:
1. ดู service status (ควรเป็น **Active**)
2. ดู metrics (CPU, Memory, Network)
3. ตรวจสอบว่า service restart บ่อยหรือไม่

## 🔧 วิธีแก้ไข

### แก้ไข Backend Service ไม่ได้รัน

1. **ตรวจสอบ Build Logs:**
   - แก้ไข build errors
   - Commit และ push ใหม่

2. **ตรวจสอบ Deploy Logs:**
   - ดู error messages
   - แก้ไขตาม error

3. **Restart Service:**
   - ไปที่ service → **Settings** → **Restart**

### แก้ไข Database Connection Issues

1. **ตรวจสอบ DATABASE_URL:**
   ```bash
   # ใน Railway Dashboard
   Postgres Service → Connect → Postgres Connection URL
   ```

2. **ตั้งค่า DATABASE_URL ใน Backend:**
   - ไปที่ Backend service → **Settings** → **Variables**
   - เพิ่ม `DATABASE_URL` จาก Postgres service

3. **Push Database Schema:**
   ```bash
   # ใน Railway Deploy Logs หรือ CLI
   npx prisma db push
   ```

### แก้ไข Port Issues

Backend ควรจะ listen ที่ `process.env.PORT` (Railway จะ set อัตโนมัติ)

**ตรวจสอบ:**
- ดู Deploy Logs: `🚀 Server is running on port XXXX`
- ตรวจสอบว่า port ไม่ใช่ 3001 (Railway จะใช้ port อื่น)

### แก้ไข Environment Variables

**Backend Required Variables:**
```bash
DATABASE_URL=postgresql://... (required)
JWT_SECRET=your-secret-key (required)
JWT_EXPIRES_IN=7d (optional, default)
CORS_ORIGIN=https://your-frontend.railway.app (required)
PORT=XXXX (Railway auto-set)
NODE_ENV=production (optional)
```

**Frontend Required Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app (required)
```

## 📋 Checklist

ก่อน deploy ตรวจสอบ:

- [ ] Build สำเร็จ (ไม่มี errors)
- [ ] Environment variables ครบ
- [ ] DATABASE_URL ถูกต้อง
- [ ] Postgres service รันอยู่
- [ ] Backend service start สำเร็จ
- [ ] Health check endpoint ทำงาน (`/health`)
- [ ] CORS_ORIGIN ตั้งค่าถูกต้อง

## 🆘 Emergency Fixes

### Restart All Services
1. ไปที่ Railway Dashboard
2. Restart Backend service
3. Restart Frontend service (ถ้าจำเป็น)

### Redeploy
1. Push code ใหม่ไปยัง GitHub
2. Railway จะ auto-deploy
3. ตรวจสอบ Build และ Deploy Logs

### Reset Database (ถ้าจำเป็น)
```bash
# ใน Railway CLI
npx prisma migrate reset
npx prisma db push
npx prisma db seed
```

## 📞 Support

ถ้ายังแก้ไขไม่ได้:
1. ตรวจสอบ Railway logs ทั้งหมด
2. ตรวจสอบ GitHub issues
3. ติดต่อ Railway support

---

**Last Updated**: 2024


