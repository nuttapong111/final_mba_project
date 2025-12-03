# การตั้งค่า ML Service สำหรับ Backend

## ภาพรวม

Backend สามารถเชื่อมต่อกับ ML Service ได้ 2 วิธี:

1. **ตั้งค่าผ่าน UI (แนะนำ)** - ตั้งค่าในหน้า Settings (`/settings`)
2. **ตั้งค่าผ่าน Environment Variable** - สำหรับ deployment บน Railway/Production

## วิธีที่ 1: ตั้งค่าผ่าน UI (แนะนำ)

1. เข้าสู่ระบบด้วยบัญชี **Super Admin** หรือ **School Admin**
2. ไปที่หน้า **Settings** (`/settings`)
3. เลื่อนลงไปที่ส่วน **"ตั้งค่า AI สำหรับตรวจข้อสอบ"**
4. เลือก **AI Provider**:
   - **Gemini AI** - ใช้ Gemini เท่านั้น
   - **ML Model** - ใช้ ML Service เท่านั้น
   - **ทั้งคู่** - ใช้ ML เป็นหลัก, Gemini เป็นสำรอง
5. กรอก **ML API URL** (ถ้าเลือก ML หรือ Both):
   - สำหรับ Railway: `https://terrific-joy-production.up.railway.app`
   - สำหรับ Local: `http://localhost:8000`
6. กด **"บันทึกการตั้งค่า AI"**

## วิธีที่ 2: ตั้งค่าผ่าน Environment Variable (สำหรับ Railway)

### สำหรับ Backend Service บน Railway:

1. ไปที่ Backend Service (endearing-renewal) ใน Railway Dashboard
2. ไปที่แท็บ **"Variables"**
3. เพิ่ม Environment Variable:

```bash
ML_API_URL=https://terrific-joy-production.up.railway.app
```

**หมายเหตุ:** แทนที่ URL ด้วย URL จริงของ ML Service ที่ deploy บน Railway

### ตัวอย่าง Environment Variables สำหรับ Backend:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Gemini AI (ถ้าใช้ Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# ML Service (ถ้าใช้ ML)
ML_API_URL=https://terrific-joy-production.up.railway.app

# Other variables...
PORT=3000
NODE_ENV=production
```

## ลำดับความสำคัญของ ML API URL

Backend จะหา ML API URL ตามลำดับนี้:

1. **Database Settings** (`AISettings.mlApiUrl`) - ตั้งค่าในหน้า Settings
2. **Environment Variable** (`ML_API_URL`) - ตั้งค่าใน Railway Variables
3. **Default** (`http://localhost:8000`) - สำหรับ development เท่านั้น

## การทดสอบการเชื่อมต่อ

### 1. ทดสอบ ML Service โดยตรง:

```bash
curl -X POST https://terrific-joy-production.up.railway.app/api/grade \
  -H "Content-Type: application/json" \
  -d '{
    "question": "คำถามตัวอย่าง",
    "answer": "คำตอบของนักเรียน",
    "maxScore": 100
  }'
```

### 2. ทดสอบผ่าน Backend API:

```bash
# ต้อง login และใช้ token ก่อน
curl -X POST https://eduflow-backend.up.railway.app/api/assignment-grading/ai-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assignmentTitle": "การบ้านตัวอย่าง",
    "assignmentDescription": "คำอธิบายการบ้าน",
    "studentNotes": "นักเรียนส่งไฟล์การบ้าน",
    "maxScore": 100
  }'
```

## การตรวจสอบสถานะ ML Service

### Health Check:

```bash
curl https://terrific-joy-production.up.railway.app/health
```

**Response ที่คาดหวัง:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "service": "ml-grading-service"
}
```

## Troubleshooting

### ปัญหา: Backend ไม่สามารถเชื่อมต่อกับ ML Service ได้

**ตรวจสอบ:**
1. ML Service ทำงานอยู่หรือไม่ (ตรวจสอบ Health Check)
2. ML API URL ถูกต้องหรือไม่
3. ML Service เปิด port 8000 หรือไม่
4. Network/Firewall อนุญาตให้ backend เชื่อมต่อได้หรือไม่

### ปัญหา: ML Service return 404

**แก้ไข:**
- ตรวจสอบว่า ML Service URL ถูกต้อง
- ตรวจสอบว่า endpoint `/api/grade` มีอยู่จริง
- ตรวจสอบว่า ML Service build สำเร็จแล้ว

### ปัญหา: ML Service return 500

**แก้ไข:**
- ตรวจสอบ logs ของ ML Service
- ตรวจสอบว่า ML Service เชื่อมต่อ database ได้หรือไม่
- ตรวจสอบว่า environment variables ของ ML Service ถูกต้องหรือไม่

## สรุป

**สำหรับ Railway Deployment:**

1. **ML Service (terrific-joy):**
   - Root Directory: `ml-service/`
   - Builder: Dockerfile
   - Environment Variables:
     - `DATABASE_URL` (ใช้ database เดียวกับ backend)
     - `PORT=8000`

2. **Backend Service (endearing-renewal):**
   - Environment Variables:
     - `ML_API_URL=https://terrific-joy-production.up.railway.app`
     - `GEMINI_API_KEY=your_key` (ถ้าใช้ Gemini)
     - `DATABASE_URL=...`

3. **ตั้งค่าใน UI (แนะนำ):**
   - ไปที่ `/settings`
   - เลือก AI Provider และกรอก ML API URL
   - บันทึกการตั้งค่า

## หมายเหตุ

- ML Service ใช้ database เดียวกับ backend (ผ่าน `DATABASE_URL`)
- ML Service จะถูกเรียกผ่าน HTTP API (`/api/grade`)
- Backend จะ fallback ไปใช้ Gemini ถ้า ML Service ไม่สามารถใช้งานได้ (ถ้าเลือก "BOTH")

