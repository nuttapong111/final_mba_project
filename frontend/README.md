# Frontend - LMS Platform

Frontend application สำหรับระบบ LMS Platform สร้างด้วย Next.js 14

## 🚀 การเริ่มต้น

### ติดตั้ง Dependencies
```bash
npm install
```

### รัน Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📁 โครงสร้างโปรเจกต์

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   └── login/         # หน้า Login
│   ├── (dashboard)/       # Dashboard routes (ต้อง login)
│   │   ├── dashboard/     # หน้า Dashboard หลัก
│   │   ├── courses/       # หน้าจัดการหลักสูตร
│   │   ├── exams/         # หน้าจัดการข้อสอบ
│   │   └── analytics/     # หน้ารายงานและวิเคราะห์
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirect to login)
│
├── components/            # React Components
│   ├── ui/               # UI Components (Button, Card, Input)
│   └── layout/           # Layout Components (Header, Sidebar)
│
├── lib/                   # Utilities & Helpers
│   ├── mockData.ts       # Mock data สำหรับ development
│   └── utils.ts          # Utility functions
│
├── store/                 # State Management (Zustand)
│   └── authStore.ts      # Authentication store
│
└── types/                 # TypeScript Types
    └── index.ts
```

## 🛠 เทคโนโลยีที่ใช้

- **Next.js 14** - React Framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Hero UI** - UI Components (Headless UI + Heroicons)
- **Zustand** - State management
- **SweetAlert2** - Beautiful alerts
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📝 ฟีเจอร์ที่พร้อมใช้งาน

- ✅ หน้า Login
- ✅ Dashboard พร้อมสถิติ
- ✅ หน้าจัดการหลักสูตร (Courses)
- ✅ หน้าจัดการข้อสอบ (Exams)
- ✅ หน้ารายงานและวิเคราะห์ (Analytics)
- ✅ Layout พร้อม Header และ Sidebar
- ✅ Mock Data สำหรับทดสอบ

## 🔐 Authentication

ตอนนี้ใช้ Mock Authentication สำหรับ development
- Email: ใดๆ ก็ได้
- Password: ใดๆ ก็ได้

ในอนาคตจะเชื่อมต่อกับ Backend API

## 🎨 Design System

### Colors
- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)

### Components
- Card-based design
- Light theme
- Modern and clean UI
- Responsive design

## 📦 Build

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
npm test
```

## 📄 License

Proprietary - All rights reserved
