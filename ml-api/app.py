"""
ML API for Automated Essay Grading
This API will be used when the ML model is trained and ready
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
from typing import Dict, Optional

app = Flask(__name__)
CORS(app)

# Model will be loaded here when ready
model = None
model_path = os.getenv('ML_MODEL_PATH', './models/grading_model.pkl')

def load_model():
    """Load the trained ML model"""
    global model
    try:
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            print(f"Model loaded from {model_path}")
        else:
            print(f"Model not found at {model_path}. Using fallback scoring.")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

def extract_features(question: str, answer: str) -> Dict:
    """
    Extract features from question and answer for ML model
    This is a placeholder - implement actual feature extraction based on your model
    """
    return {
        'answer_length': len(answer),
        'question_length': len(question),
        'word_count': len(answer.split()),
        # Add more features based on your model requirements
    }

def predict_score(question: str, answer: str, max_score: int = 100) -> tuple:
    """
    Predict score using ML model
    Returns (score, feedback)
    """
    if model is None:
        # Fallback: simple heuristic scoring
        answer_length = len(answer)
        word_count = len(answer.split())
        
        # Simple scoring based on length (placeholder)
        base_score = min(70, (word_count / 50) * 100)
        score = max(0, min(max_score, int(base_score)))
        
        feedback = "โมเดล ML ยังไม่พร้อมใช้งาน ใช้การให้คะแนนแบบพื้นฐาน"
        return score, feedback
    
    try:
        # Extract features
        features = extract_features(question, answer)
        
        # Convert to numpy array (adjust based on your model's input format)
        feature_vector = np.array([[features['answer_length'], features['word_count']]])
        
        # Predict score
        predicted_score = model.predict(feature_vector)[0]
        
        # Normalize to max_score range
        score = max(0, min(max_score, int(predicted_score)))
        
        # Generate feedback (placeholder - implement based on your model)
        feedback = f"คะแนนจาก ML Model: {score}/{max_score}"
        
        return score, feedback
    except Exception as e:
        print(f"Error predicting score: {e}")
        # Fallback
        return 70, "เกิดข้อผิดพลาดในการประเมินด้วย ML Model"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
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
        
        score, feedback = predict_score(question, answer, max_score)
        
        return jsonify({
            'success': True,
            'score': score,
            'feedback': feedback
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    load_model()
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)

