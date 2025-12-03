# ML Service Deployment Guide

ML Service เป็น Python Flask API service ที่แยกออกมาเพื่อ deploy เป็น service อิสระ

## สถานะปัจจุบัน

**ML Service เป็น service เดียว** ที่ต้อง deploy แยกจาก backend และ frontend

## โครงสร้าง

```
capstone_final_project/
├── backend/          # Node.js/TypeScript Backend (deploy แยก)
├── frontend/         # Next.js Frontend (deploy แยก)
└── ml-service/       # Python ML API (deploy แยก) ⭐
```

## การ Deploy ML Service

### Option 1: Deploy ด้วย Docker

```bash
cd ml-service
docker build -t ml-grading-service .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e PORT=8000 \
  ml-grading-service
```

### Option 2: Deploy บน Railway/Render/Heroku

1. สร้าง service ใหม่บน platform ที่เลือก
2. Connect GitHub repository
3. ตั้งค่า root directory เป็น `ml-service/`
4. ตั้งค่า environment variables:
   - `DATABASE_URL` - Database connection string (ใช้ database เดียวกับ backend)
   - `PORT` - Port สำหรับ service (default: 8000)
   - `MODEL_PATH` - Path สำหรับเก็บ model file (optional)

### Option 3: Deploy บน VPS/Server

```bash
cd ml-service
pip install -r requirements.txt
export DATABASE_URL="postgresql://..."
export PORT=8000
python app.py
```

หรือใช้ systemd service:

```ini
[Unit]
Description=ML Grading Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ml-service
Environment="DATABASE_URL=postgresql://..."
Environment="PORT=8000"
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname  # Required
PORT=8000                                                  # Optional, default: 8000
MODEL_PATH=./models/grading_model.pkl                      # Optional
```

## API Endpoints

### Health Check
```
GET /health
```

### Grade Answer
```
POST /api/grade
Content-Type: application/json

{
  "question": "คำถาม",
  "answer": "คำตอบของนักเรียน",
  "maxScore": 100
}
```

### Train Model
```
POST /api/train
Content-Type: application/json

{
  "gradingTasks": [
    {
      "question": "คำถาม",
      "answer": "คำตอบ",
      "teacherScore": 80,
      "teacherFeedback": "ดีมาก"
    }
  ]
}
```

### Fetch Training Data
```
POST /api/fetch-training-data
```

## การเชื่อมต่อกับ Backend

Backend จะเรียกใช้ ML Service ผ่าน HTTP:

```typescript
const mlApiUrl = await getMLApiUrl(schoolId) || process.env.ML_API_URL || 'http://localhost:8000';
const response = await fetch(`${mlApiUrl}/api/grade`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question, answer, maxScore }),
});
```

## การตั้งค่าใน Backend

1. ตั้งค่า ML API URL ในหน้า Settings (`/settings`):
   - เลือก AI Provider เป็น "ML" หรือ "BOTH"
   - กรอก ML API URL (เช่น `http://localhost:8000` หรือ `https://ml-service.railway.app`)

2. หรือตั้งค่าใน environment variable:
   ```bash
   ML_API_URL=http://localhost:8000
   ```

## การเทรน Model

```bash
cd ml-service
python train_model.py
```

หรือใช้ API:
```bash
curl -X POST http://localhost:8000/api/train \
  -H "Content-Type: application/json" \
  -d '{"gradingTasks": [...]}'
```

## สรุป

- **ML Service = 1 service** ที่ต้อง deploy แยก
- ใช้ database เดียวกับ backend (ผ่าน `DATABASE_URL`)
- Backend จะเรียกใช้ ML Service ผ่าน HTTP API
- สามารถ deploy บน platform ใดก็ได้ที่รองรับ Python

