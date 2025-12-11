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
    // Use officially recommended models from Gemini API documentation
    // Note: gemini-pro is an alias that automatically points to the most stable Pro version
    const modelsToTry = [
      'gemini-2.5-flash',  // Latest recommended - fastest and most efficient
      'gemini-2.5-pro',    // Latest recommended - most powerful
      'gemini-pro',        // Alias - automatically points to most stable Pro version
      'gemini-1.0-pro',    // Stable original model (fallback)
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
          
          // If it's a 404, try next model (don't throw yet)
          if (response.status === 404) {
            const nextModelIndex = modelsToTry.indexOf(model) + 1;
            if (nextModelIndex < modelsToTry.length) {
              console.log(`[GEMINI] Model ${model} not found (404), trying next model: ${modelsToTry[nextModelIndex]}`);
              continue;
            }
          }
          
          // If it's not 404 or it's the last model, throw the error
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
 * Get AI grading suggestion with PDF file support using Gemini File API
 */
export const getAIGradingSuggestionWithPDF = async (
  question: string,
  pdfFileUrl: string,
  pdfS3Key: string | null,
  maxScore: number = 100,
  schoolId?: string | null,
  geminiApiKey?: string
): Promise<AIGradingResult> => {
  try {
    const apiKey = geminiApiKey || await getGeminiApiKey(schoolId || null) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API Key ไม่พบ กรุณาตั้งค่าในหน้าตั้งค่า AI หรือตั้งค่า GEMINI_API_KEY ใน environment variables');
    }

    // Download PDF file
    let pdfBuffer: Buffer;
    try {
      console.log('[GEMINI FILE API] Downloading PDF file...', { pdfFileUrl: pdfFileUrl?.substring(0, 50), pdfS3Key });
      const { downloadFile } = await import('./pdfService');
      pdfBuffer = await downloadFile(pdfFileUrl, pdfS3Key);
      console.log('[GEMINI FILE API] PDF file downloaded successfully, size:', pdfBuffer.length, 'bytes');
    } catch (downloadError: any) {
      console.error('[GEMINI FILE API] Error downloading PDF file:', downloadError);
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ PDF ได้: ${downloadError.message}`);
    }
    
    // Convert PDF to base64 for inline embedding
    // Note: Gemini API supports inline file data with base64 encoding
    const base64Pdf = pdfBuffer.toString('base64');
    
    console.log('[GEMINI FILE API] PDF converted to base64, length:', base64Pdf.length);

    // Use Gemini API with file
    const prompt = `คุณเป็นผู้ช่วยตรวจการบ้านอัตนัย ให้คะแนนและให้คำแนะนำสำหรับการบ้านของนักเรียน

คำถาม/โจทย์: ${question}

กรุณาตรวจสอบไฟล์ PDF ที่แนบมาและให้:
1. คะแนน (0-${maxScore}) โดยพิจารณาจากความถูกต้อง ความสมบูรณ์ และความชัดเจน
2. คำแนะนำที่เป็นประโยชน์สำหรับนักเรียน

ตอบในรูปแบบ JSON:
{
  "score": <คะแนน>,
  "feedback": "<คำแนะนำ>"
}

คำแนะนำควรเป็นภาษาไทยและให้คำแนะนำที่เป็นประโยชน์`;

    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        
        console.log(`[GEMINI FILE API] Trying model: ${model}`);
        console.log(`[GEMINI FILE API] PDF size: ${base64Pdf.length} characters (base64)`);
        
        // Check PDF size limit (Gemini has a 20MB limit for base64 encoded files)
        const pdfSizeMB = base64Pdf.length * 3 / 4 / 1024 / 1024;
        if (pdfSizeMB > 20) {
          throw new Error(`ไฟล์ PDF ใหญ่เกินไป (${pdfSizeMB.toFixed(2)} MB). ขนาดสูงสุดที่รองรับคือ 20 MB`);
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    text: prompt,
                  },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: base64Pdf,
                    },
                  },
                ],
              }],
            }),
        });

        if (!response.ok) {
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (e) {
            console.warn('[GEMINI FILE API] Could not parse error response as JSON');
          }
          
          const errorMessage = errorData.error?.message || errorData.error || `Gemini API error with ${model}: ${response.status} ${response.statusText}`;
          console.error(`[GEMINI FILE API] ${errorMessage}`, { 
            status: response.status, 
            statusText: response.statusText,
            errorData 
          });
          lastError = new Error(errorMessage);
          
          if (response.status === 404) {
            const nextModelIndex = modelsToTry.indexOf(model) + 1;
            if (nextModelIndex < modelsToTry.length) {
              console.log(`[GEMINI FILE API] Model ${model} not found, trying next model`);
              continue;
            }
          }
          
          // If it's a 400 error, it might be that the model doesn't support PDF
          if (response.status === 400) {
            const nextModelIndex = modelsToTry.indexOf(model) + 1;
            if (nextModelIndex < modelsToTry.length) {
              console.log(`[GEMINI FILE API] Model ${model} returned 400, trying next model`);
              continue;
            }
          }
          
          throw lastError;
        }

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
        
        console.log(`[GEMINI FILE API] Success with model: ${model}`);

        // Parse JSON from response
        let jsonText = text.trim();
        if (jsonText.includes('```json')) {
          jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        const parsed = JSON.parse(jsonText);
        
        const score = Math.max(0, Math.min(maxScore, Math.round(parsed.score || 0)));
        const feedback = parsed.feedback || 'ไม่สามารถให้คำแนะนำได้';

        return {
          score,
          feedback,
        };
      } catch (error: any) {
        if (modelsToTry.indexOf(model) === modelsToTry.length - 1) {
          throw error;
        }
        lastError = error;
        continue;
      }
    }

    if (lastError) {
      throw lastError;
    }
    throw new Error('All Gemini models failed');
  } catch (error: any) {
    console.error('[GEMINI FILE API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Don't try fallback for PDF files - it will fail with DOMMatrix error
    // Just throw a clear error message
    const isPDFProcessingError = error.message?.includes('DOMMatrix') || 
                                 error.message?.includes('canvas') ||
                                 error.message?.includes('browser') ||
                                 error.message?.includes('PDF processing');
    
    if (isPDFProcessingError) {
      throw new Error(`ไม่สามารถตรวจไฟล์ PDF ได้: PDF processing library error. กรุณาตรวจสอบว่า Gemini API รองรับไฟล์ PDF หรือไม่`);
    }
    
    // Check if it's a download error
    if (error.message?.includes('ดาวน์โหลด')) {
      throw error; // Re-throw download errors as-is
    }
    
    // For other errors (like Gemini API errors), provide a clear message
    throw new Error(`ไม่สามารถตรวจไฟล์ PDF ได้: ${error.message}. กรุณาตรวจสอบว่า Gemini API รองรับไฟล์ PDF หรือไม่`);
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

