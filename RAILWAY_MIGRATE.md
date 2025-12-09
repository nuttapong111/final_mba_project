# 🚀 Railway Migration Guide

คู่มือการ migrate Prisma database บน Railway สำหรับ schema ใหม่ (ML Training Settings)

## 📋 ขั้นตอนการ Migrate

### วิธีที่ 1: ใช้ Railway CLI (แนะนำ)

1. **ติดตั้ง Railway CLI** (ถ้ายังไม่มี):
```bash
npm i -g @railway/cli
```

2. **Login เข้า Railway**:
```bash
railway login
```

3. **Link project** (ถ้ายังไม่ได้ link):
```bash
railway link
```

4. **สร้าง Migration File** (รันในเครื่อง local):
```bash
cd backend
npx prisma migrate dev --name add_ml_training_settings
```

5. **Push code ขึ้น GitHub**:
```bash
git add .
git commit -m "feat: เพิ่ม ML training schema"
git push origin main
```

6. **Deploy บน Railway** (Railway จะ auto-deploy จาก GitHub):
   - Railway จะรัน `prisma migrate deploy` อัตโนมัติตาม `railway.json`
   - หรือรัน manual:
```bash
railway run --service backend npx prisma migrate deploy
```

### วิธีที่ 2: ใช้ Railway Shell (Manual)

1. เข้า Railway Dashboard → Backend Service
2. ไปที่แท็บ **"Deploy Logs"** หรือ **"Shell"**
3. รันคำสั่ง:
```bash
cd backend
npx prisma migrate deploy
```

### วิธีที่ 3: ใช้ Prisma DB Push (สำหรับ Development)

⚠️ **ไม่แนะนำสำหรับ Production** แต่ถ้าต้องการ sync schema โดยตรง:

```bash
railway run --service backend npx prisma db push
```

## 🔍 ตรวจสอบ Migration

หลังจาก migrate แล้ว ตรวจสอบว่า tables ถูกสร้างแล้ว:

```bash
railway run --service backend npx prisma studio
```

หรือใช้ SQL query:
```sql
SELECT * FROM "MLTrainingSettings";
SELECT * FROM "MLTrainingHistory";
```

## 📝 Schema ที่เพิ่มเข้ามา

### MLTrainingSettings
- `id`: UUID (Primary Key)
- `schoolId`: String? (Foreign Key to School)
- `aiWeight`: Float (default: 0.3)
- `teacherWeight`: Float (default: 0.7)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### MLTrainingHistory
- `id`: UUID (Primary Key)
- `schoolId`: String? (Foreign Key to School)
- `accuracy`: Float? (R² score)
- `mse`: Float? (Mean Squared Error)
- `mae`: Float? (Mean Absolute Error)
- `samples`: Int
- `aiWeight`: Float
- `teacherWeight`: Float
- `status`: String (completed/failed)
- `errorMessage`: String?
- `createdAt`: DateTime

## ⚠️ Troubleshooting

### Error: Migration not found
- ตรวจสอบว่า migration files ถูก push ขึ้น GitHub แล้ว
- ตรวจสอบว่า `prisma/migrations` folder อยู่ใน repository

### Error: Database connection failed
- ตรวจสอบ `DATABASE_URL` ใน Railway environment variables
- ตรวจสอบว่า PostgreSQL service ทำงานอยู่

### Error: Table already exists
- ถ้าใช้ `db push` อาจเกิด conflict
- ลองใช้ `migrate deploy` แทน

## 🎯 Next Steps

หลังจาก migrate สำเร็จ:

1. ✅ ตรวจสอบว่า tables ถูกสร้างแล้ว
2. ✅ ทดสอบ API endpoints:
   - `GET /api/ml-training/stats`
   - `GET /api/ml-training/settings`
   - `POST /api/ml-training/train`
3. ✅ เข้าใช้งานหน้า Admin ML Training: `/admin/ml-training`
