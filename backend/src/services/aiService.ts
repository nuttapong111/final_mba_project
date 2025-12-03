import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIGradingResult {
  score: number;
  feedback: string;
}

/**
 * Get AI grading suggestion from Gemini
 */
export const getAIGradingSuggestion = async (
  question: string,
  answer: string,
  maxScore: number = 100
): Promise<AIGradingResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `คุณเป็นผู้ช่วยตรวจข้อสอบอัตนัย ให้คะแนนและให้คำแนะนำสำหรับคำตอบของนักเรียน

คำถาม: ${question}

คำตอบของนักเรียน: ${answer}

กรุณาให้:
1. คะแนน (0-${maxScore}) โดยพิจารณาจากความถูกต้อง ความสมบูรณ์ และความชัดเจน
2. คำแนะนำที่เป็นประโยชน์สำหรับนักเรียน

ตอบในรูปแบบ JSON:
{
  "score": <คะแนน>,
  "feedback": "<คำแนะนำ>"
}

คำแนะนำควรเป็นภาษาไทยและให้คำแนะนำที่เป็นประโยชน์`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    // Try to extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    
    // Validate score range
    const score = Math.max(0, Math.min(maxScore, Math.round(parsed.score || 0)));
    const feedback = parsed.feedback || 'ไม่สามารถให้คำแนะนำได้';

    return {
      score,
      feedback,
    };
  } catch (error: any) {
    console.error('Error calling Gemini AI:', error);
    
    // Fallback: return default values
    return {
      score: Math.round(maxScore * 0.7), // Default to 70% of max score
      feedback: 'ไม่สามารถให้คำแนะนำจาก AI ได้ในขณะนี้ กรุณาตรวจสอบด้วยตนเอง',
    };
  }
};

/**
 * Get AI grading suggestion using Python ML API (for future use)
 */
export const getMLGradingSuggestion = async (
  question: string,
  answer: string,
  maxScore: number = 100
): Promise<AIGradingResult> => {
  try {
    const mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';
    const response = await fetch(`${mlApiUrl}/api/grade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        maxScore,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    const data = await response.json() as { score?: number; feedback?: string };
    return {
      score: Math.max(0, Math.min(maxScore, Math.round(data.score || 0))),
      feedback: data.feedback || 'ไม่สามารถให้คำแนะนำได้',
    };
  } catch (error: any) {
    console.error('Error calling ML API:', error);
    
    // Fallback to Gemini if ML API fails
    return getAIGradingSuggestion(question, answer, maxScore);
  }
};

