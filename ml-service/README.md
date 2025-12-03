# ML Grading Service

Machine Learning API service for automated essay grading.

**⚠️ หมายเหตุ: ML Service เป็น service เดียวที่ต้อง deploy แยกจาก backend และ frontend**

## Features

- Train ML model from historical grading data
- Grade student answers using trained model
- RESTful API for integration with main backend
- Can be deployed as separate service
- Supports Docker deployment

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export PORT=8000
export MODEL_PATH=./models/grading_model.pkl
```

3. Train the model:
```bash
python train_model.py
```

4. Run the API:
```bash
python app.py
```

## API Endpoints

### POST /api/grade
Grade a student's answer using ML model.

Request:
```json
{
  "question": "คำถาม",
  "answer": "คำตอบของนักเรียน",
  "maxScore": 100
}
```

Response:
```json
{
  "success": true,
  "score": 75,
  "feedback": "คำแนะนำจาก ML model",
  "confidence": 0.85
}
```

### POST /api/train
Train the model using historical grading data.

Request:
```json
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

Response:
```json
{
  "success": true,
  "message": "Model trained successfully",
  "accuracy": 0.87
}
```

### GET /api/health
Health check endpoint.

## Database Schema

The service connects to the main database to fetch training data:
- `GradingTask` table - contains question, answer, teacherScore, teacherFeedback
- Only uses tasks where `status = 'graded'` and `teacherScore IS NOT NULL`

