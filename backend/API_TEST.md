# API Testing Guide

## Prerequisites
1. รัน PostgreSQL database
2. สร้างไฟล์ `.env` และตั้งค่า `DATABASE_URL`
3. รัน `npm run db:push` เพื่อสร้าง database schema
4. รัน `npm run dev` เพื่อเริ่ม server

## Testing with cURL

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

เก็บ `token` จาก response เพื่อใช้ในคำสั่งต่อไป

### 4. Get Current User
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Get Courses
```bash
curl http://localhost:3001/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Get Users
```bash
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get Live Sessions
```bash
curl http://localhost:3001/api/live-sessions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Get Webboard Posts
```bash
curl http://localhost:3001/api/webboard/courses/COURSE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9. Get Grading Tasks
```bash
curl http://localhost:3001/api/grading/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Testing with Postman

1. Import collection จากไฟล์ `postman_collection.json` (ถ้ามี)
2. ตั้งค่า environment variable `token` หลังจาก login
3. ทดสอบ endpoints ต่างๆ

## Testing with Vitest

```bash
npm test
```

## Expected Response Format

```json
{
  "success": true,
  "data": { ... }
}
```

หรือ

```json
{
  "success": false,
  "error": "Error message"
}
```


