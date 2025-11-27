# 🔧 แก้ไขปัญหา API "Not found" แม้มี User ใน Database

## ❌ ปัญหาที่พบ

Database ใน Railway มี user อยู่แล้ว แต่เมื่อเรียก API login ได้ error "Not found"

## 🔍 สาเหตุที่เป็นไปได้

1. **API Endpoint ไม่ถูกต้อง**
   - Frontend เรียก endpoint ผิด
   - `NEXT_PUBLIC_API_URL` ไม่ถูกต้อง

2. **Backend Service ไม่ได้รัน**
   - Backend service crash หรือไม่ได้ start
   - ตรวจสอบ Deploy Logs

3. **Database Connection Issues**
   - Backend ไม่สามารถเชื่อมต่อ database
   - `DATABASE_URL` ไม่ถูกต้อง

4. **CORS Issues**
   - Frontend URL ไม่ตรงกับ `CORS_ORIGIN`
   - Backend reject request

5. **API Route ไม่ถูกต้อง**
   - Route path ไม่ตรงกัน

## ✅ วิธีแก้ไข

### 1. ตรวจสอบ API Endpoint

**Backend Route:**
- Path: `/api/auth/login`
- Method: `POST`

**Frontend Call:**
- ตรวจสอบ `frontend/lib/api/client.ts`:
  ```typescript
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  ```
- Frontend เรียก: `{NEXT_PUBLIC_API_URL}/auth/login`
- Full URL: `https://your-backend.railway.app/api/auth/login`

**ตรวจสอบ:**
1. ไปที่ Frontend service → Settings → Variables
2. ตรวจสอบ `NEXT_PUBLIC_API_URL`:
   - ควรเป็น: `https://your-backend.railway.app/api`
   - **สำคัญ:** ต้องมี `/api` ต่อท้าย

### 2. ตรวจสอบ Backend Service

**ตรวจสอบว่า Backend รันอยู่:**

1. ไปที่ Backend service → Deploy Logs
2. ดู logs:
   - ✅ `🚀 Server is running on port XXXX`
   - ✅ `📊 Environment: production`
   - ❌ Error messages (ถ้ามี)

**ทดสอบ Health Check:**
```bash
curl https://your-backend.railway.app/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

**ถ้าได้ 404 หรือ 502:**
- Backend service ไม่ได้รัน
- ตรวจสอบ Deploy Logs
- Restart service

### 3. ตรวจสอบ Frontend API URL

**ใน Railway Dashboard:**

1. ไปที่ Frontend service → Settings → Variables
2. ตรวจสอบ `NEXT_PUBLIC_API_URL`:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

**สำคัญ:**
- ต้องเป็น URL ของ Backend service
- ต้องมี `/api` ต่อท้าย
- ต้องใช้ `https://` (ไม่ใช่ `http://`)

**ตัวอย่าง:**
```env
# ถูกต้อง
NEXT_PUBLIC_API_URL=https://finalmbaproject-production.up.railway.app/api

# ผิด
NEXT_PUBLIC_API_URL=https://finalmbaproject-production.up.railway.app
NEXT_PUBLIC_API_URL=http://finalmbaproject-production.up.railway.app/api
```

### 4. ตรวจสอบ Database Connection

**ถ้า Backend ไม่สามารถเชื่อมต่อ database:**

1. ตรวจสอบ `DATABASE_URL` ใน Backend service:
   - ไปที่ Postgres service → Connect → Postgres Connection URL
   - Copy และตั้งค่าใน Backend service variables

2. ตรวจสอบ Database:
   - ไปที่ Postgres service → Database → Data
   - ตรวจสอบว่ามี user อยู่

3. ทดสอบ Database Connection:
   ```bash
   railway run --service backend npx prisma db execute --stdin
   ```

### 5. ตรวจสอบ CORS Settings

**ใน Backend service → Settings → Variables:**

ตรวจสอบ `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://your-frontend.railway.app
```

**สำคัญ:**
- ต้องเป็น URL ของ Frontend service
- ต้องใช้ `https://` (ไม่ใช่ `http://`)
- ไม่ต้องมี trailing slash

**ตัวอย่าง:**
```env
# ถูกต้อง
CORS_ORIGIN=https://finalmbaproject-production.up.railway.app

# ผิด
CORS_ORIGIN=https://finalmbaproject-production.up.railway.app/
CORS_ORIGIN=http://finalmbaproject-production.up.railway.app
```

### 6. ทดสอบ API โดยตรง

**ทดสอบ Login API:**
```bash
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"school@example.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

**ถ้าได้ "Not found":**
- ตรวจสอบ API endpoint
- ตรวจสอบ Backend service รันอยู่

**ถ้าได้ "Internal server error":**
- ตรวจสอบ Database connection
- ตรวจสอบ Deploy Logs

## 📋 Checklist

ตรวจสอบทีละขั้นตอน:

- [ ] Backend service รันอยู่ (Status: Active)
- [ ] Health check ทำงาน (`/health`)
- [ ] `NEXT_PUBLIC_API_URL` ถูกต้อง (มี `/api` ต่อท้าย)
- [ ] `CORS_ORIGIN` ถูกต้อง (เป็น Frontend URL)
- [ ] `DATABASE_URL` ถูกต้อง (จาก Postgres service)
- [ ] Database มี user อยู่
- [ ] API endpoint ถูกต้อง (`/api/auth/login`)
- [ ] ทดสอบ API โดยตรงสำเร็จ

## 🚀 Quick Fix

**ถ้ายังไม่ได้:**

1. **ตรวจสอบ Backend Service:**
   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **ตรวจสอบ Frontend API URL:**
   - Frontend service → Settings → Variables
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api`

3. **ตรวจสอบ CORS:**
   - Backend service → Settings → Variables
   - `CORS_ORIGIN` = `https://your-frontend.railway.app`

4. **Restart Services:**
   - Restart Backend service
   - Restart Frontend service

5. **ทดสอบ API:**
   ```bash
   curl -X POST https://your-backend.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"school@example.com","password":"password123"}'
   ```

## 🐛 Troubleshooting

### Error: "Not found" (404)

**สาเหตุ:**
- API endpoint ไม่ถูกต้อง
- Backend service ไม่ได้รัน

**แก้ไข:**
1. ตรวจสอบ Backend service รันอยู่
2. ตรวจสอบ API endpoint: `/api/auth/login`
3. ตรวจสอบ `NEXT_PUBLIC_API_URL` มี `/api` ต่อท้าย

### Error: "Internal server error" (500)

**สาเหตุ:**
- Database connection error
- Backend code error

**แก้ไข:**
1. ตรวจสอบ `DATABASE_URL`
2. ตรวจสอบ Deploy Logs
3. ตรวจสอบ Database connection

### Error: CORS error

**สาเหตุ:**
- `CORS_ORIGIN` ไม่ถูกต้อง
- Frontend URL ไม่ตรงกับ `CORS_ORIGIN`

**แก้ไข:**
1. ตรวจสอบ `CORS_ORIGIN` = Frontend URL
2. ตรวจสอบ Frontend URL ถูกต้อง

---

**Last Updated**: 2024


