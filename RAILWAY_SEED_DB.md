# 🌱 วิธี Seed Database บน Railway

## 📋 ข้อมูลที่จะถูกสร้าง

### Users ที่จะถูกสร้าง:
- **Super Admin**: `admin@example.com` / `password123`
- **School Admin**: `school@example.com` / `password123`
- **Teacher**: `teacher@example.com` / `password123`
- **Student 1**: `student1@example.com` / `password123`
- **Student 2**: `student2@example.com` / `password123`

### ข้อมูลอื่นๆ:
- School: โรงเรียนกวดวิชา ABC
- Course: คณิตศาสตร์ ม.4
- Question Bank และ Questions
- Live Sessions
- Webboard Posts

## 🚀 วิธี Seed Database

### วิธีที่ 1: ใช้ Railway CLI (แนะนำ)

**ขั้นตอน:**

1. **ติดตั้ง Railway CLI** (ถ้ายังไม่มี):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login Railway**:
   ```bash
   railway login
   ```

3. **Link Project**:
   ```bash
   railway link
   ```
   - เลือก project ที่ต้องการ

4. **Seed Database**:
   ```bash
   cd backend
   railway run npm run db:seed
   ```

   หรือ:
   ```bash
   railway run --service backend npm run db:seed
   ```

### วิธีที่ 2: ใช้ Railway Dashboard (Shell)

**ขั้นตอน:**

1. ไปที่ Railway Dashboard
2. เลือก Backend service (`final_mba_project`)
3. ไปที่ **"Deploy Logs"** tab
4. คลิก **"Shell"** หรือ **"Open Shell"**
5. รันคำสั่ง:
   ```bash
   cd backend
   npm run db:seed
   ```

### วิธีที่ 3: ใช้ Railway Dashboard (Variables + Deploy)

**ขั้นตอน:**

1. ไปที่ Backend service → **Settings** → **Variables**
2. ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าแล้ว (จาก Postgres service)
3. ไปที่ **Deployments** tab
4. คลิก **"Redeploy"**
5. หลังจาก deploy สำเร็จ → ใช้ Shell (วิธีที่ 2)

### วิธีที่ 4: ใช้ Prisma Studio (GUI)

**ขั้นตอน:**

1. ใช้ Railway CLI:
   ```bash
   railway run --service backend npx prisma studio
   ```

2. Prisma Studio จะเปิดใน browser
3. สามารถเพิ่ม/แก้ไขข้อมูลผ่าน GUI

## 🔍 ตรวจสอบว่า Seed สำเร็จ

### 1. ตรวจสอบผ่าน Railway Shell

```bash
railway run --service backend npx prisma studio
```

หรือ:

```bash
railway run --service backend npx prisma db execute --stdin
```

### 2. ตรวจสอบผ่าน API

**Test Login:**
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
    "token": "...",
    "user": {
      "id": "...",
      "email": "school@example.com",
      "role": "SCHOOL_ADMIN"
    }
  }
}
```

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**สาเหตุ:**
- `DATABASE_URL` ไม่ถูกต้อง
- Database service ไม่ได้รัน

**แก้ไข:**
1. ตรวจสอบ Postgres service รันอยู่
2. ตรวจสอบ `DATABASE_URL` ใน Backend service variables
3. Copy `DATABASE_URL` จาก Postgres service → Connect → Postgres Connection URL

### Error: "Prisma schema not found"

**สาเหตุ:**
- Root Directory ไม่ถูกต้อง
- ไม่ได้อยู่ใน `backend` directory

**แก้ไข:**
```bash
cd backend
npm run db:seed
```

### Error: "Module not found"

**สาเหตุ:**
- Dependencies ไม่ได้ติดตั้ง
- Prisma client ไม่ได้ generate

**แก้ไข:**
```bash
cd backend
npm install
npx prisma generate
npm run db:seed
```

### Error: "Table does not exist"

**สาเหตุ:**
- Database schema ไม่ได้ถูก push

**แก้ไข:**
```bash
cd backend
npx prisma db push
npm run db:seed
```

## 📝 Quick Commands

### Seed Database:
```bash
railway run --service backend npm run db:seed
```

### Push Schema:
```bash
railway run --service backend npx prisma db push
```

### Generate Prisma Client:
```bash
railway run --service backend npx prisma generate
```

### Open Prisma Studio:
```bash
railway run --service backend npx prisma studio
```

## ✅ Checklist

ก่อน seed ตรวจสอบ:

- [ ] Postgres service รันอยู่
- [ ] `DATABASE_URL` ถูกตั้งค่าใน Backend service
- [ ] Database schema ถูก push แล้ว (`npx prisma db push`)
- [ ] Prisma client ถูก generate แล้ว (`npx prisma generate`)
- [ ] Backend service build สำเร็จ

## 🎯 หลังจาก Seed สำเร็จ

1. **ทดสอบ Login:**
   - ใช้ `school@example.com` / `password123`
   - ควร login สำเร็จ

2. **ตรวจสอบ Users:**
   - ใช้ Prisma Studio หรือ API
   - ตรวจสอบว่ามี users ทั้งหมด 5 คน

3. **ตรวจสอบ Courses:**
   - ตรวจสอบว่ามี course "คณิตศาสตร์ ม.4"

---

**Last Updated**: 2024

