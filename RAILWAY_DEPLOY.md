# 🚂 Railway Deployment Guide

คู่มือการ deploy LMS Platform ไปยัง Railway สำหรับ Staging Environment

## 📋 Prerequisites

1. บัญชี Railway (https://railway.app)
2. Railway CLI (optional): `npm i -g @railway/cli`
3. Git repository ที่เชื่อมต่อกับ Railway

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  (Next.js)
│   Railway       │
└────────┬────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│   Backend       │  (Hono + Prisma)
│   Railway       │
└────────┬────────┘
         │
         │ Database Connection
         │
┌────────▼────────┐
│   PostgreSQL    │  (Railway Database)
│   Railway       │
└─────────────────┘
```

## 🚀 Step-by-Step Deployment

### 1. สร้าง Project ใน Railway

1. เข้าไปที่ https://railway.app
2. คลิก "New Project"
3. เลือก "Deploy from GitHub repo" (หรือ "Empty Project" ถ้าจะ deploy แบบ manual)

### 2. เพิ่ม PostgreSQL Database

1. ใน Railway project dashboard
2. คลิก "+ New" → "Database" → "Add PostgreSQL"
3. Railway จะสร้าง PostgreSQL database และให้ `DATABASE_URL` อัตโนมัติ

### 3. Deploy Backend

#### 3.1 สร้าง Backend Service

1. คลิก "+ New" → "GitHub Repo" (หรือ "Empty Service")
2. เลือก repository และตั้งค่า:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start`

#### 3.2 ตั้งค่า Environment Variables

ใน Backend service settings → Variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

**หมายเหตุ**: 
- `DATABASE_URL` จะถูก inject อัตโนมัติจาก PostgreSQL service
- `CORS_ORIGIN` ต้องเป็น URL ของ Frontend service

#### 3.3 ตั้งค่า Build และ Deploy

Railway จะ detect `railway.json` อัตโนมัติ หรือตั้งค่า manual:

- **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma db push`
- **Start Command**: `npm run start`

#### 3.4 Seed Database (ครั้งแรก)

หลังจาก deploy สำเร็จ:

1. เปิด Railway CLI shell หรือใช้ "Deploy Logs"
2. รันคำสั่ง:
```bash
npm run db:seed
```

หรือใช้ Railway CLI:
```bash
railway run --service backend npm run db:seed
```

### 4. Deploy Frontend

#### 4.1 สร้าง Frontend Service

1. คลิก "+ New" → "GitHub Repo"
2. เลือก repository เดียวกัน และตั้งค่า:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

#### 4.2 ตั้งค่า Environment Variables

ใน Frontend service settings → Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
```

**หมายเหตุ**: ใช้ URL ของ Backend service ที่ Railway สร้างให้

#### 4.3 ตั้งค่า Build และ Deploy

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

### 5. ตั้งค่า Custom Domain (Optional)

1. ในแต่ละ service → Settings → Domains
2. คลิก "Generate Domain" หรือ "Custom Domain"
3. ตั้งค่า DNS records ตามที่ Railway แนะนำ

## 🔧 Configuration Files

### Backend `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && npx prisma generate && npx prisma db push"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Frontend `railway.json`
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

## 📝 Environment Variables Summary

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-injected from Railway |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `production` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://frontend.railway.app` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend.railway.app/api` |

## 🔄 Database Migrations

### วิธีที่ 1: ใช้ Railway CLI
```bash
railway run --service backend npx prisma migrate deploy
```

### วิธีที่ 2: ใช้ Railway Shell
1. เปิด Backend service → Deploy Logs
2. ใช้ "Shell" tab
3. รัน:
```bash
npx prisma migrate deploy
# หรือ
npx prisma db push
```

## 🧪 Testing After Deployment

### 1. Test Backend Health
```bash
curl https://your-backend.railway.app/health
```

### 2. Test API Endpoints
```bash
# Login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 3. Test Frontend
เปิด browser ไปที่ Frontend URL และทดสอบ login

## 🐛 Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database
- ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าถูกต้อง
- ตรวจสอบว่า PostgreSQL service ทำงานอยู่
- ตรวจสอบ network connectivity ระหว่าง services

### Frontend ไม่สามารถเรียก API
- ตรวจสอบ `NEXT_PUBLIC_API_URL` ถูกต้อง
- ตรวจสอบ CORS settings ใน Backend
- ตรวจสอบว่า Backend service ทำงานอยู่

### Build Fail
- ตรวจสอบ logs ใน Railway dashboard
- ตรวจสอบว่า dependencies ติดตั้งครบ
- ตรวจสอบ Node.js version (ควรเป็น 18+)

### Database Migration Fail
- ตรวจสอบ `DATABASE_URL` ถูกต้อง
- รัน `npx prisma generate` ก่อน migrate
- ตรวจสอบ Prisma schema syntax

## 📊 Monitoring

1. **Logs**: ดู logs ใน Railway dashboard → Service → Deploy Logs
2. **Metrics**: ดู CPU, Memory, Network ใน Service → Metrics
3. **Database**: ดู database metrics ใน PostgreSQL service

## 🔐 Security Best Practices

1. **JWT Secret**: ใช้ strong random secret key
2. **Environment Variables**: อย่า commit `.env` files
3. **CORS**: ตั้งค่าเฉพาะ domain ที่ต้องการ
4. **Database**: ใช้ Railway's managed PostgreSQL (มี SSL)
5. **HTTPS**: Railway ให้ HTTPS อัตโนมัติ

## 🔄 CI/CD Workflow

Railway จะ auto-deploy เมื่อ:
- Push code ไปยัง branch ที่เชื่อมต่อ
- Merge PR (ถ้าตั้งค่าไว้)

### Manual Deploy
```bash
railway up
```

### Deploy Specific Service
```bash
railway up --service backend
railway up --service frontend
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🆘 Support

ถ้ามีปัญหา:
1. ตรวจสอบ Railway logs
2. ตรวจสอบ environment variables
3. ตรวจสอบ service health status
4. ติดต่อ Railway support

---

**Last Updated**: 2024

