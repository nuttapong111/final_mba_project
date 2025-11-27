# Learning Management System (LMS) Platform

ระบบจัดการการเรียนรู้ออนไลน์แบบ Multi-tenant สำหรับโรงเรียนกวดวิชา

## 📋 สารบัญ

- [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [การติดตั้งและใช้งาน](#การติดตั้งและใช้งาน)
- [API Documentation](#api-documentation)
- [การพัฒนา](#การพัฒนา)

## 🎯 ภาพรวมโปรเจกต์

ระบบ LMS แบบ Multi-tenant ที่ออกแบบมาเพื่อรองรับโรงเรียนกวดวิชาหลายสถาบันบนแพลตฟอร์มเดียว พร้อมระบบ AI สำหรับการตรวจข้อสอบและประเมินผลการเรียน

### เป้าหมายหลัก
- รองรับผู้ใช้พร้อมกัน 10,000+ users
- Multi-tenant architecture แยกข้อมูลแต่ละสถาบัน
- ระบบ AI สำหรับตรวจข้อสอบอัตโนมัติ
- Live class และ Video on Demand
- Analytics และรายงานแบบ Real-time

## 🛠 เทคโนโลยีที่ใช้

### Backend
- **Framework**: Node.js with Hono
- **Database**: PostgreSQL (หลัก), Redis (Cache)
- **File Storage**: AWS S3 / Cloudinary
- **Video Streaming**: AWS CloudFront / Vimeo API
- **AI/ML**: OpenAI API / Custom ML Models

### Frontend (Web)
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Hero UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand / React Query
- **Notifications**: SweetAlert2
- **Forms**: React Hook Form + Zod

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation
- **State Management**: Zustand

### Infrastructure
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry / LogRocket
- **CDN**: Cloudflare

## 📁 โครงสร้างโปรเจกต์

```
capstone_final_project/
├── README.md
├── package.json
├── .gitignore
├── .env.example
│
├── backend/                    # Backend API (Hono)
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   ├── ai/                # AI services
│   │   └── index.ts           # Entry point
│   ├── prisma/                # Prisma schema
│   ├── tests/                 # Backend tests
│   └── package.json
│
├── frontend/                   # Next.js Web Application
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   │   ├── (auth)/        # Auth routes
│   │   │   ├── (dashboard)/   # Dashboard routes
│   │   │   ├── api/           # API routes
│   │   │   └── layout.tsx
│   │   ├── components/        # React components
│   │   │   ├── ui/            # UI components (Hero UI)
│   │   │   ├── layout/        # Layout components
│   │   │   ├── course/        # Course components
│   │   │   ├── exam/          # Exam components
│   │   │   ├── live-class/    # Live class components
│   │   │   └── analytics/     # Analytics components
│   │   ├── lib/               # Utilities & helpers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # State management
│   │   ├── types/             # TypeScript types
│   │   └── data/              # Mock data
│   ├── public/                # Static assets
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── mobile/                     # React Native App
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/       # Reusable components
│   │   ├── navigation/       # Navigation setup
│   │   ├── services/         # API services
│   │   ├── store/            # State management
│   │   └── utils/            # Utilities
│   ├── android/
│   ├── ios/
│   └── package.json
│
├── shared/                     # Shared code/types
│   ├── types/                 # Shared TypeScript types
│   └── constants/             # Shared constants
│
└── docs/                       # Documentation
    ├── api/                   # API documentation
    ├── deployment/            # Deployment guides
    └── architecture/          # Architecture diagrams
```

## ✨ ฟีเจอร์หลัก

### 1. ระบบหลัก (Core System)
- ✅ Multi-tenant Architecture
- ✅ Custom Branding (Logo, สี, Domain)
- ✅ Subscription & Billing Management

### 2. ระบบผู้ใช้งาน (User Management)
- ✅ Role-based Access Control (Super Admin, School Admin, Teacher, Student, Parent)
- ✅ Authentication & Authorization
- ✅ Bulk User Import
- ✅ Profile Management

### 3. ระบบจัดการหลักสูตร (Course Management)
- ✅ Create/Edit/Delete Courses
- ✅ Content Management (Video, Documents, Slides)
- ✅ Lesson Structure
- ✅ Prerequisites
- ✅ Enrollment System

### 4. ระบบ AI สำหรับการตรวจและประเมิน
- ✅ Auto-grading (Multiple Choice)
- ✅ AI Essay Scoring
- ✅ Plagiarism Detection
- ✅ Learning Analytics
- ✅ Auto Question Generation

### 5. ระบบข้อสอบและแบบฝึกหัด
- ✅ Multiple Question Types
- ✅ Question Bank
- ✅ Time-limited Exams
- ✅ Random Questions
- ✅ Instant Results
- ✅ Exam Statistics

### 6. ระบบเรียนออนไลน์
- ✅ Live Class (Real-time)
- ✅ Screen Sharing / Whiteboard
- ✅ Session Recording
- ✅ Video on Demand
- ✅ Progress Tracking
- ✅ Subtitle Support

### 7. ระบบรายงานและวิเคราะห์ (Analytics)
- ✅ Performance Dashboard
- ✅ Attendance Tracking
- ✅ Score Statistics
- ✅ Comparative Analysis
- ✅ Personal Progress Reports

### 8. ระบบการสื่อสาร
- ✅ Announcements
- ✅ Notifications
- ✅ Teacher-Student Chat
- ✅ Assignment Submission
- ✅ Schedule Management

### 9. ระบบการเงิน
- ✅ Pricing Tiers
- ✅ Subscription Management
- ✅ Payment Gateway
- ✅ Invoice Generation
- ✅ Revenue Reports

### 10. ระบบจัดการเนื้อหา (CMS)
- ✅ File/Media Management
- ✅ Auto File Conversion
- ✅ CDN Integration
- ✅ File Size/Type Limits

## 🚀 การติดตั้งและใช้งาน

### Prerequisites
- Node.js 18+ 
- npm หรือ yarn
- PostgreSQL 14+ (หรือใช้ Docker)
- Docker & Docker Compose (optional, สำหรับ PostgreSQL)

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd capstone_final_project
```

#### 2. Setup Database

**วิธีที่ 1: ใช้ Docker (แนะนำ - ข้อมูลจะไม่หาย)**
```bash
# Start PostgreSQL with Docker (ข้อมูลจะถูกเก็บใน volume)
docker-compose up -d postgres

# หรือใช้ script ที่เตรียมไว้
./scripts/start.sh
```

**วิธีที่ 2: ใช้ PostgreSQL แบบ Local**
```bash
# ตรวจสอบว่า PostgreSQL service ทำงานอยู่
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql
```

#### 3. Backend Setup
```bash
cd backend
npm install

# สร้างไฟล์ .env (ถ้ายังไม่มี)
cp .env.example .env
# แก้ไข DATABASE_URL ใน .env ตามการตั้งค่าของคุณ

# Setup database schema และ seed ข้อมูลเริ่มต้น
npm run db:setup

# Start development server
npm run dev
```

**หมายเหตุ:** 
- `db:setup` จะตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่ ถ้ามีจะไม่ seed ซ้ำ (เพื่อรักษาข้อมูลเดิม)
- ข้อมูลจะถูกเก็บถาวรใน PostgreSQL volume (ถ้าใช้ Docker) หรือใน PostgreSQL database (ถ้าใช้ local)

#### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# แก้ไข .env.local ตามการตั้งค่าของคุณ
npm run dev
```

#### 5. การจัดการ Database

**ข้อมูลจะไม่หายไปเมื่อปิดเครื่อง** เพราะ:
- ใช้ Docker volume สำหรับเก็บข้อมูล (ถ้าใช้ Docker)
- ใช้ PostgreSQL database แบบ persistent (ถ้าใช้ local PostgreSQL)

**คำสั่งที่เกี่ยวข้อง:**
```bash
# Setup database (ครั้งแรกหรือเมื่อต้องการ reset)
cd backend
npm run db:setup

# Seed ข้อมูลใหม่ (จะไม่ duplicate ถ้ามีอยู่แล้ว)
npm run db:seed

# ดูข้อมูลใน database
npm run db:studio

# Reset database (ระวัง: จะลบข้อมูลทั้งหมด)
docker-compose down -v  # ถ้าใช้ Docker
# หรือ drop database แล้วรัน db:setup ใหม่
```

#### 4. Mobile Setup
```bash
cd mobile
npm install
# สำหรับ iOS
cd ios && pod install && cd ..
npm run ios
# สำหรับ Android
npm run android
```

## 📚 API Documentation

API Documentation จะอยู่ที่ `/docs/api` หรือเข้าถึงได้ที่ `/api-docs` เมื่อรัน server

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.yourdomain.com`

### Authentication
ใช้ JWT Token สำหรับ authentication
```
Authorization: Bearer <token>
```

## 🔐 Security Features

- SSL/TLS Encryption
- Two-Factor Authentication (2FA)
- JWT Token-based Auth
- Role-based Access Control
- Data Encryption at Rest
- PDPA Compliance
- Regular Security Audits

## 📊 Performance Targets

- Response Time: < 2 seconds
- Concurrent Users: 10,000+
- Video Streaming: Smooth playback
- Database Queries: Optimized with indexes
- Caching: Redis for frequently accessed data

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 🚂 Deployment

### Railway (Staging)

สำหรับ deploy ไปยัง Railway staging environment:

```bash
# ดูคู่มือการ deploy
cat RAILWAY_DEPLOY.md

# หรือรัน helper script
./scripts/railway-deploy.sh
```

**Quick Start:**
1. สร้าง Railway project และเพิ่ม PostgreSQL database
2. Deploy Backend service (root: `backend`)
3. Deploy Frontend service (root: `frontend`)
4. ตั้งค่า Environment Variables ตาม `RAILWAY_DEPLOY.md`
5. Seed database: `railway run --service backend npm run db:seed`

ดูรายละเอียดเพิ่มเติมใน [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)

## 📝 License

Proprietary - All rights reserved

## 👥 Team

- Development Team
- AI/ML Team
- DevOps Team

## 📞 Support

สำหรับคำถามหรือปัญหา กรุณาติดต่อ support@yourdomain.com

---

**หมายเหตุ**: โปรเจกต์นี้กำลังอยู่ในระหว่างการพัฒนา ฟีเจอร์บางอย่างอาจยังไม่พร้อมใช้งาน

