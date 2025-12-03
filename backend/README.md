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

### Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Gemini AI (สำหรับ AI grading)
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service (สำหรับ ML-based grading)
ML_API_URL=http://localhost:8000

# AWS S3 (สำหรับ file upload)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

**หมายเหตุ:** สำหรับการตั้งค่า ML Service แบบละเอียด ดูที่ [ML_SERVICE_SETUP.md](./ML_SERVICE_SETUP.md)

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
- `POST /api/grading/ai-feedback` - สร้างคำแนะนำจาก AI (Gemini หรือ ML)

### Assignment Grading
- `GET /api/assignment-grading/tasks` - ดึงงานตรวจการบ้าน
- `PATCH /api/assignment-grading/tasks/:submissionId` - ให้คะแนนการบ้าน
- `POST /api/assignment-grading/ai-feedback` - สร้างคำแนะนำจาก AI สำหรับการบ้าน

### AI Settings
- `GET /api/ai-settings` - ดึงการตั้งค่า AI (Super Admin, School Admin)
- `PUT /api/ai-settings` - อัปเดตการตั้งค่า AI (Super Admin, School Admin)

## 🔐 Authentication

ใช้ JWT Token สำหรับ authentication

```
Authorization: Bearer <token>
```

## 🗄️ Database Schema

ดูได้ที่ `prisma/schema.prisma`

## 🤖 ML Service Integration

Backend สามารถเชื่อมต่อกับ ML Service สำหรับ AI grading ได้ 2 วิธี:

1. **ตั้งค่าผ่าน UI** - ไปที่ `/settings` และตั้งค่า AI Provider และ ML API URL
2. **ตั้งค่าผ่าน Environment Variable** - ตั้งค่า `ML_API_URL` ใน environment variables

ดูรายละเอียดเพิ่มเติมที่ [ML_SERVICE_SETUP.md](./ML_SERVICE_SETUP.md)

## 🧪 Testing

```bash
npm test
```


