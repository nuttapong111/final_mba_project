import { getActiveAIProvider, getMLApiUrl, getGeminiApiKey } from './aiSettingsService';

export interface AIGradingResult {
  score: number;
  feedback: string;
}

/**
 * Get AI grading suggestion from Gemini or ML
 */
export const getAIGradingSuggestion = async (
  question: string,
  answer: string,
  maxScore: number = 100,
  schoolId?: string | null,
  geminiApiKey?: string
): Promise<AIGradingResult> => {
  try {
    // Get active provider
    const provider = await getActiveAIProvider(schoolId || null);

    // Use ML if provider is ML or BOTH
    if (provider === 'ML' || provider === 'BOTH') {
      try {
        const mlResult = await getMLGradingSuggestion(question, answer, maxScore, schoolId);
        // If ML succeeds and provider is ML only, return ML result
        if (provider === 'ML') {
          return mlResult;
        }
        // If BOTH, we'll use ML as primary and Gemini as fallback/validation
      } catch (mlError) {
        console.error('ML API error, falling back to Gemini:', mlError);
        // Fall through to Gemini if ML fails
      }
    }

    // Use Gemini (default or fallback)
    // Get API key from settings or use provided key or env variable
    const apiKey = geminiApiKey || await getGeminiApiKey(schoolId || null) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GEMINI] API Key not found. schoolId:', schoolId, 'env key exists:', !!process.env.GEMINI_API_KEY);
      throw new Error('Gemini API Key ไม่พบ กรุณาตั้งค่าในหน้าตั้งค่า AI หรือตั้งค่า GEMINI_API_KEY ใน environment variables');
    }
    
    console.log('[GEMINI] Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');
    
    // Use REST API directly with v1 API version to support newer models
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

    console.log('[GEMINI] Calling REST API with prompt length:', prompt.length);
    
    // Try multiple models with fallback mechanism
    const modelsToTry = [
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002',
      'gemini-pro',
    ];
    
    let lastError: Error | null = null;
    
    for (const model of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        
        console.log(`[GEMINI] Trying model: ${model}`);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt,
              }],
            }],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = `Gemini API error with ${model}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`;
          console.log(`[GEMINI] ${errorMessage}`);
          lastError = new Error(errorMessage);
          
          // If it's a 404, try next model
          if (response.status === 404 && modelsToTry.indexOf(model) < modelsToTry.length - 1) {
            continue;
          }
          
          throw lastError;
        }
        
        // Success - break out of loop
        const result = await response.json() as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                text?: string;
              }>;
            };
          }>;
        };
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        console.log(`[GEMINI] Success with model: ${model}`);
        console.log('[GEMINI] Received response (first 200 chars):', text.substring(0, 200));

        // Parse JSON from response
        // Try to extract JSON from markdown code blocks if present
        let jsonText = text.trim();
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        console.log('[GEMINI] Parsing JSON (first 200 chars):', jsonText.substring(0, 200));
        const parsed = JSON.parse(jsonText);
        
        // Validate score range
        const score = Math.max(0, Math.min(maxScore, Math.round(parsed.score || 0)));
        const feedback = parsed.feedback || 'ไม่สามารถให้คำแนะนำได้';

        console.log('[GEMINI] Successfully parsed result:', { score, feedbackLength: feedback.length });

        return {
          score,
          feedback,
        };
      } catch (error: any) {
        // If this is the last model, throw the error
        if (modelsToTry.indexOf(model) === modelsToTry.length - 1) {
          throw error;
        }
        // Otherwise, continue to next model
        lastError = error;
        continue;
      }
    }
    
    // If we get here, all models failed
    if (lastError) {
      throw lastError;
    }
    throw new Error('All Gemini models failed');
  } catch (error: any) {
    console.error('Error calling Gemini AI:', error);
    
    // Check if it's an API key error
    if (error.message?.includes('API_KEY') || error.message?.includes('API key') || error.message?.includes('ไม่พบ')) {
      throw new Error('Gemini API Key ไม่พบหรือไม่ถูกต้อง กรุณาตั้งค่า GEMINI_API_KEY ใน environment variables หรือตั้งค่าในหน้าตั้งค่า AI');
    }
    
    // Check if it's a quota/rate limit error
    if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.status === 429) {
      throw new Error('Gemini API ถึงขีดจำกัดการใช้งาน กรุณาลองใหม่อีกครั้งในภายหลัง');
    }
    
    // Re-throw the error instead of returning default values
    throw error;
  }
};

/**
 * Get AI grading suggestion using Python ML API (for future use)
 */
export const getMLGradingSuggestion = async (
  question: string,
  answer: string,
  maxScore: number = 100,
  schoolId?: string | null
): Promise<AIGradingResult> => {
  try {
    const mlApiUrl = await getMLApiUrl(schoolId || null) || process.env.ML_API_URL || 'http://localhost:8000';
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

