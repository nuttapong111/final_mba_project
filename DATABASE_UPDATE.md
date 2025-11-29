# 📊 คู่มือการอัพเดท Database สำหรับ Video Progress Tracking

## ✅ ตรวจสอบ Schema

`ContentProgress` model มีอยู่แล้วใน `backend/prisma/schema.prisma`:

```prisma
model ContentProgress {
  id            String   @id @default(uuid())
  contentId     String
  studentId     String
  courseId      String
  completed     Boolean  @default(false)
  completedAt   DateTime?
  progress      Float    @default(0) // 0-100 for videos
  lastPosition  Int?     // for video playback position (in seconds)
  updatedAt     DateTime @updatedAt

  content       LessonContent @relation(fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([contentId, studentId])
  @@index([contentId])
  @@index([studentId])
  @@index([courseId])
}
```

## 🔄 วิธี Sync Database

### สำหรับ Local Development:

```bash
cd backend
npm run db:push
```

หรือ

```bash
npx prisma db push
```

### สำหรับ Railway (Production):

Railway จะรัน `prisma db push` อัตโนมัติเมื่อ deploy ผ่าน script ใน `package.json`:

```json
"railway:deploy": "npm run build && npx prisma generate && npx prisma db push && npm run db:seed"
```

**หมายเหตุ:** ถ้าใช้ `prisma migrate` แทน `db push` ให้รัน:

```bash
npx prisma migrate deploy
```

## ✅ ตรวจสอบว่า Table ถูกสร้างแล้ว

### วิธีที่ 1: ใช้ Prisma Studio

```bash
cd backend
npm run db:studio
```

เปิด browser ไปที่ `http://localhost:5555` และตรวจสอบว่า `ContentProgress` table มีอยู่

### วิธีที่ 2: ใช้ PostgreSQL Client

```sql
-- ตรวจสอบว่า table มีอยู่
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'ContentProgress';

-- ตรวจสอบ columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ContentProgress';
```

## 📋 Checklist

- [ ] Schema มี `ContentProgress` model
- [ ] รัน `prisma db push` หรือ `prisma migrate deploy`
- [ ] ตรวจสอบว่า table ถูกสร้างใน database
- [ ] ทดสอบ API endpoints:
  - `GET /api/content-progress/content/:contentId`
  - `POST /api/content-progress/video`
  - `POST /api/content-progress/complete`

## 🆘 Troubleshooting

### Error: "Table does not exist"

**แก้ไข:**
```bash
cd backend
npx prisma db push
```

### Error: "Column does not exist"

**แก้ไข:**
1. ตรวจสอบว่า schema ถูกต้อง
2. รัน `npx prisma db push --force-reset` (⚠️ จะลบข้อมูลทั้งหมด)
3. หรือรัน `npx prisma migrate dev` เพื่อสร้าง migration

### Error: "Unique constraint violation"

**แก้ไข:**
- ตรวจสอบว่า `@@unique([contentId, studentId])` ถูกต้อง
- ลบข้อมูลเก่าถ้าจำเป็น

## 📝 หมายเหตุ

- **`lastPosition`**: เก็บตำแหน่งวิดีโอเป็นวินาที (Int)
- **`progress`**: เก็บ progress เป็นเปอร์เซ็นต์ 0-100 (Float)
- **`completed`**: เก็บสถานะว่าเรียนจบหรือยัง (Boolean)
- **`courseId`**: ใช้สำหรับคำนวณ course progress

---

**🎉 ไม่ต้องแก้ไข schema เพิ่มเติม - มีทุกอย่างพร้อมแล้ว!**

