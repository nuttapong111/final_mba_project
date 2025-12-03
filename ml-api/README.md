# ML API for Grading System

This is a Python-based Machine Learning API service for automated essay grading.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export ML_MODEL_PATH=./models/grading_model.pkl
export PORT=8000
```

3. Train the model (when ready):
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
  "score": 75,
  "feedback": "คำแนะนำจาก ML model"
}
```

## Future Development

- Train model with historical grading data
- Fine-tune model for different subjects
- Add confidence score
- Compare with Gemini AI results

