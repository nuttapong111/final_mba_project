"""
ML Grading Service
Separate service for ML-based essay grading
Can be deployed independently
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')
MODEL_PATH = os.getenv('MODEL_PATH', './models/grading_model.pkl')

# Model will be loaded here when ready
model = None
vectorizer = None

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def extract_features(question: str, answer: str) -> Dict:
    """
    Extract features from question and answer for ML model
    This should be customized based on your model requirements
    """
    # Basic features
    features = {
        'answer_length': len(answer),
        'question_length': len(question),
        'word_count': len(answer.split()),
        'sentence_count': len([s for s in answer.split('.') if s.strip()]),
        'avg_word_length': np.mean([len(w) for w in answer.split()]) if answer.split() else 0,
        # Add more features based on your model
    }
    return features

def load_model():
    """Load the trained ML model"""
    global model, vectorizer
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
                model = model_data.get('model')
                vectorizer = model_data.get('vectorizer')
            logger.info(f"Model loaded from {MODEL_PATH}")
        else:
            logger.warning(f"Model not found at {MODEL_PATH}. Using fallback scoring.")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = None
        vectorizer = None

def predict_score(question: str, answer: str, max_score: int = 100) -> tuple:
    """
    Predict score using ML model
    Returns (score, feedback, confidence)
    """
    if model is None:
        # Fallback: simple heuristic scoring
        answer_length = len(answer)
        word_count = len(answer.split())
        
        # Simple scoring based on length (placeholder)
        base_score = min(70, (word_count / 50) * 100)
        score = max(0, min(max_score, int(base_score)))
        
        feedback = "โมเดล ML ยังไม่พร้อมใช้งาน ใช้การให้คะแนนแบบพื้นฐาน"
        confidence = 0.5
        return score, feedback, confidence
    
    try:
        # Extract features
        features = extract_features(question, answer)
        
        # Convert to feature vector (adjust based on your model's input format)
        if vectorizer:
            # If using text vectorization
            feature_text = f"{question} {answer}"
            feature_vector = vectorizer.transform([feature_text])
        else:
            # If using numerical features
            feature_vector = np.array([[
                features['answer_length'],
                features['word_count'],
                features['sentence_count'],
                features['avg_word_length']
            ]])
        
        # Predict score
        predicted_score = model.predict(feature_vector)[0]
        
        # Normalize to max_score range
        score = max(0, min(max_score, int(predicted_score)))
        
        # Calculate confidence (if model supports it)
        if hasattr(model, 'predict_proba'):
            confidence = model.predict_proba(feature_vector)[0].max()
        else:
            confidence = 0.8  # Default confidence
        
        # Generate feedback based on score
        if score >= max_score * 0.8:
            feedback = "คำตอบดีมาก มีความถูกต้องและครบถ้วน"
        elif score >= max_score * 0.6:
            feedback = "คำตอบดี แต่ยังสามารถปรับปรุงได้"
        else:
            feedback = "คำตอบควรปรับปรุง เพิ่มรายละเอียดและความชัดเจน"
        
        return score, feedback, confidence
    except Exception as e:
        logger.error(f"Error predicting score: {e}")
        # Fallback
        return 70, "เกิดข้อผิดพลาดในการประเมินด้วย ML Model", 0.5

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'service': 'ml-grading-service'
    })

@app.route('/api/grade', methods=['POST'])
def grade():
    """Grade a student's answer"""
    try:
        data = request.json
        
        question = data.get('question', '')
        answer = data.get('answer', '')
        max_score = data.get('maxScore', 100)
        
        if not question or not answer:
            return jsonify({
                'success': False,
                'error': 'กรุณาระบุคำถามและคำตอบ'
            }), 400
        
        score, feedback, confidence = predict_score(question, answer, max_score)
        
        return jsonify({
            'success': True,
            'score': score,
            'feedback': feedback,
            'confidence': confidence
        })
    except Exception as e:
        logger.error(f"Error in grade endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/train', methods=['POST'])
def train():
    """Train the model using provided data"""
    try:
        data = request.json
        grading_tasks = data.get('gradingTasks', [])
        
        if not grading_tasks:
            return jsonify({
                'success': False,
                'error': 'ไม่มีข้อมูลสำหรับเทรนโมเดล'
            }), 400
        
        # Import training function
        from train_model import train_from_data
        
        result = train_from_data(grading_tasks)
        
        # Reload model after training
        load_model()
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'accuracy': result.get('accuracy', 0),
            'samples': len(grading_tasks)
        })
    except Exception as e:
        logger.error(f"Error in train endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fetch-training-data', methods=['POST'])
def fetch_training_data():
    """Fetch training data from database"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'error': 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
            }), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch graded tasks with teacher scores AND AI feedback
        # Include both AI feedback and teacher feedback for training
        query = """
            SELECT 
                gt.id,
                gt.answer,
                gt."aiScore",
                gt."aiFeedback",
                gt."teacherScore",
                gt."teacherFeedback",
                q.question as question_text
            FROM "GradingTask" gt
            JOIN "ExamSubmission" es ON gt."submissionId" = es.id
            JOIN "Exam" e ON es."examId" = e.id
            JOIN "ExamQuestion" eq ON e.id = eq."examId" AND gt."questionId" = eq."questionId"
            JOIN "Question" q ON eq."questionId" = q.id
            WHERE gt.status = 'graded'
            AND gt."teacherScore" IS NOT NULL
            AND gt."teacherFeedback" IS NOT NULL
            ORDER BY gt."updatedAt" DESC
            LIMIT 1000
        """
        
        cursor.execute(query)
        tasks = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Format data - include both AI and teacher feedback
        training_data = []
        for task in tasks:
            # Handle case-insensitive column names from PostgreSQL
            ai_score = task.get('aiscore') or task.get('aiScore') or None
            ai_feedback = task.get('aifeedback') or task.get('aiFeedback') or ''
            teacher_score = task.get('teacherscore') or task.get('teacherScore')
            teacher_feedback = task.get('teacherfeedback') or task.get('teacherFeedback') or ''
            
            training_data.append({
                'question': task.get('question_text', '') or '',
                'answer': task.get('answer', ''),
                'aiScore': float(ai_score) if ai_score is not None else None,
                'aiFeedback': ai_feedback,
                'teacherScore': float(teacher_score),
                'teacherFeedback': teacher_feedback
            })
        
        return jsonify({
            'success': True,
            'data': training_data,
            'count': len(training_data)
        })
    except Exception as e:
        logger.error(f"Error fetching training data: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    load_model()
    port = int(os.getenv('PORT', 8000))
    logger.info(f"Starting ML Grading Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)

