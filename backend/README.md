# Backend API - LMS Platform

Backend API สำหรับระบบ LMS Platform สร้างด้วย Hono และ Prisma

## 🚀 การเริ่มต้น

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm หรือ yarn

### ติดตั้ง Dependencies
```bash
cd backend
npm install
```

### Setup Database
1. สร้างไฟล์ `.env` จาก `.env.example`
2. ตั้งค่า `DATABASE_URL` ใน `.env`
3. Generate Prisma Client:
```bash
npm run db:generate
```
4. Push schema ไปยัง database:
```bash
npm run db:push
```

### รัน Development Server
```bash
npm run dev
```

Server จะรันที่ `http://localhost:3001`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก
- `GET /api/auth/me` - ดูข้อมูลผู้ใช้ปัจจุบัน (ต้องมี token)

### Courses
- `GET /api/courses` - ดึงรายการหลักสูตร (filter ตาม role)
- `GET /api/courses/:id` - ดึงรายละเอียดหลักสูตร

### Course Teachers
- `POST /api/courses/:id/teachers` - เพิ่มอาจารย์เข้าไปในหลักสูตร
- `DELETE /api/courses/:id/teachers/:teacherId` - ลบอาจารย์ออกจากหลักสูตร
- `PATCH /api/courses/:id/teachers/:teacherId/roles` - อัปเดตบทบาทของอาจารย์

### Course Students
- `POST /api/courses/:id/students` - เพิ่มนักเรียนเข้าไปในหลักสูตร
- `DELETE /api/courses/:id/students/:studentId` - ลบนักเรียนออกจากหลักสูตร

### Users
- `GET /api/users` - ดึงรายการผู้ใช้ (filter ตาม role)
- `POST /api/users/bulk-import` - Bulk import ผู้ใช้

### Live Sessions
- `GET /api/live-sessions` - ดึงรายการห้องเรียนออนไลน์

### Webboard
- `GET /api/webboard/courses/:courseId` - ดึงคำถามใน webboard
- `POST /api/webboard/courses/:courseId/posts` - สร้างคำถามใหม่
- `POST /api/webboard/posts/:postId/replies` - ตอบคำถาม

### Grading
- `GET /api/grading/tasks` - ดึงงานที่ต้องตรวจ
- `PATCH /api/grading/tasks/:taskId` - อัปเดตคะแนนและความคิดเห็น

## 🔐 Authentication

ใช้ JWT Token สำหรับ authentication

```
Authorization: Bearer <token>
```

## 🗄️ Database Schema

ดูได้ที่ `prisma/schema.prisma`

## 🧪 Testing

```bash
npm test
```


