"""
Script to train the ML model for essay grading
Trains from historical grading data
"""

import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.feature_extraction.text import TfidfVectorizer
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_features(df):
    """
    Extract features from training data
    Includes AI feedback as features to help model learn from AI suggestions
    """
    features = []
    for _, row in df.iterrows():
        answer = str(row['answer'])
        question = str(row['question'])
        
        # Text features
        answer_length = len(answer)
        word_count = len(answer.split())
        sentence_count = len([s for s in answer.split('.') if s.strip()])
        avg_word_length = np.mean([len(w) for w in answer.split()]) if answer.split() else 0
        
        # Question-answer similarity (simple)
        common_words = set(answer.lower().split()) & set(question.lower().split())
        similarity = len(common_words) / max(len(question.split()), 1)
        
        # AI feedback features (if available)
        ai_score = row.get('aiScore', None)
        ai_feedback = str(row.get('aiFeedback', ''))
        ai_feedback_length = len(ai_feedback)
        
        # Use AI score as a feature (helps model learn from AI suggestions)
        # If AI score is not available, use 0 (will be normalized during training)
        ai_score_feature = float(ai_score) if ai_score is not None and not pd.isna(ai_score) else 0.0
        
        features.append([
            answer_length,
            word_count,
            sentence_count,
            avg_word_length,
            similarity,
            ai_score_feature,  # AI score as feature
            ai_feedback_length,  # AI feedback length as feature
        ])
    return np.array(features)

def train_from_data(grading_tasks):
    """
    Train model from grading tasks data
    Returns training metrics
    """
    try:
        # Convert to DataFrame
        df = pd.DataFrame(grading_tasks)
        
        MIN_SAMPLES = 5  # Minimum samples required for training (reduced for testing)
        if len(df) < MIN_SAMPLES:
            raise ValueError(f"ต้องการข้อมูลอย่างน้อย {MIN_SAMPLES} ตัวอย่างสำหรับเทรนโมเดล (พบ {len(df)} ตัวอย่าง)")
        
        logger.info(f"Training model with {len(df)} samples")
        
        # Extract features
        X = extract_features(df)
        y = df['teacherScore'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Model performance:")
        logger.info(f"  MSE: {mse:.2f}")
        logger.info(f"  MAE: {mae:.2f}")
        logger.info(f"  R²: {r2:.2f}")
        
        # Save model
        os.makedirs('models', exist_ok=True)
        model_path = os.getenv('MODEL_PATH', 'models/grading_model.pkl')
        
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': model,
                'vectorizer': None,  # Not using text vectorization for now
                'metrics': {
                    'mse': mse,
                    'mae': mae,
                    'r2': r2,
                    'samples': len(df)
                }
            }, f)
        
        logger.info(f"Model saved to {model_path}")
        
        return {
            'accuracy': r2,
            'mse': mse,
            'mae': mae,
            'samples': len(df)
        }
    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise

def train_from_database():
    """
    Train model by fetching data from database
    """
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch graded tasks with both AI and teacher feedback
    query = """
        SELECT 
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
        ORDER BY gt."updatedAt" DESC
        LIMIT 1000
    """
    
    cursor.execute(query)
    tasks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # Format data - include both AI and teacher feedback
    grading_tasks = []
    for task in tasks:
        # Handle case-insensitive column names from PostgreSQL
        ai_score = task.get('aiscore') or task.get('aiScore') or None
        ai_feedback = task.get('aifeedback') or task.get('aiFeedback') or ''
        teacher_score = task.get('teacherscore') or task.get('teacherScore')
        teacher_feedback = task.get('teacherfeedback') or task.get('teacherFeedback') or ''
        
        grading_tasks.append({
            'question': task.get('question_text', '') or '',
            'answer': task.get('answer', ''),
            'aiScore': float(ai_score) if ai_score is not None else None,
            'aiFeedback': ai_feedback,
            'teacherScore': float(teacher_score),
            'teacherFeedback': teacher_feedback
        })
    
    MIN_SAMPLES = 5  # Minimum samples required for training (reduced for testing)
    if len(grading_tasks) < MIN_SAMPLES:
        raise ValueError(f"ไม่พบข้อมูลเพียงพอสำหรับเทรนโมเดล (พบ {len(grading_tasks)} ตัวอย่าง ต้องการอย่างน้อย {MIN_SAMPLES})")
    
    return train_from_data(grading_tasks)

if __name__ == '__main__':
    try:
        result = train_from_database()
        print(f"\n✅ Model training completed!")
        print(f"   Accuracy (R²): {result['accuracy']:.2%}")
        print(f"   Samples: {result['samples']}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

