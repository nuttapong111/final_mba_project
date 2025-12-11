import { Context } from 'hono';
import { getAssignmentGradingTasks, gradeAssignmentSubmission, regenerateAIFeedbackForSubmission } from '../services/assignmentGradingService';
import { getAIGradingSuggestion, getAIGradingSuggestionWithPDF } from '../services/aiService';

export const getAssignmentGradingTasksController = async (c: Context) => {
  try {
    const user = c.get('user');
    const tasks = await getAssignmentGradingTasks(user);
    return c.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('[ASSIGNMENT GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const gradeAssignmentSubmissionController = async (c: Context) => {
  try {
    const user = c.get('user');
    const submissionId = c.req.param('submissionId');
    const { score, feedback } = await c.req.json();

    if (score === undefined || score === null) {
      return c.json({ success: false, error: 'กรุณาระบุคะแนน' }, 400);
    }

    const task = await gradeAssignmentSubmission(submissionId, score, feedback, user);
    return c.json({ success: true, data: task });
  } catch (error: any) {
    console.error('[ASSIGNMENT GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const generateAssignmentAIFeedbackController = async (c: Context) => {
  try {
    const user = c.get('user');
    const { 
      assignmentTitle, 
      assignmentDescription, 
      studentNotes, 
      maxScore,
      studentFileUrl,
      studentS3Key,
      studentFileName,
      teacherFileUrl,
      teacherS3Key,
      teacherFileName
    } = await c.req.json();

    if (!assignmentTitle) {
      return c.json({ success: false, error: 'กรุณาระบุชื่อการบ้าน' }, 400);
    }

    // Build assignment context (question + description + teacher's file if exists)
    let assignmentContext = `การบ้าน: ${assignmentTitle}`;
    if (assignmentDescription) {
      assignmentContext += `\nคำอธิบาย: ${assignmentDescription}`;
    }
    
    // Try to extract text from teacher's attached file (if PDF)
    if (teacherFileUrl || teacherS3Key) {
      const isTeacherPDF = teacherFileName?.toLowerCase().endsWith('.pdf');
      
      if (isTeacherPDF) {
        try {
          const { extractTextFromPDFUrl } = await import('../services/pdfService');
          const teacherFileText = await extractTextFromPDFUrl(
            teacherFileUrl || '',
            teacherS3Key || null
          );
          
          if (teacherFileText && teacherFileText.trim()) {
            assignmentContext += `\n\nไฟล์แนบจากอาจารย์ (${teacherFileName}):\n${teacherFileText}`;
            console.log(`[ASSIGNMENT AI FEEDBACK] Extracted ${teacherFileText.length} characters from teacher's PDF`);
          }
        } catch (pdfError: any) {
          console.warn(`[ASSIGNMENT AI FEEDBACK] Could not read teacher's PDF file: ${pdfError.message}`);
          // Continue without teacher's file content
        }
      }
    }
    
    // Get schoolId from user
    const schoolId = user.schoolId || null;
    
    // Check if student submitted a PDF file
    const isStudentPDF = studentFileName?.toLowerCase().endsWith('.pdf');
    
    let result;
    
    if (isStudentPDF && (studentFileUrl || studentS3Key)) {
      // Use Gemini File API for PDF files
      console.log('[ASSIGNMENT AI FEEDBACK] Using Gemini File API for PDF');
      result = await getAIGradingSuggestionWithPDF(
        assignmentContext,
          studentFileUrl || '',
        studentS3Key || null,
        maxScore || 100,
        schoolId
        );
        } else {
      // Use text-based method for non-PDF files or text notes
      let studentAnswer = studentNotes || '';
      if (!studentAnswer) {
      studentAnswer = `นักเรียนส่งไฟล์: ${studentFileName || 'ไฟล์การบ้าน'}`;
    }

      console.log('[ASSIGNMENT AI FEEDBACK] Generating feedback with text:', {
      assignmentTitle,
      studentAnswerLength: studentAnswer.length,
      maxScore,
      schoolId,
    });

      result = await getAIGradingSuggestion(assignmentContext, studentAnswer, maxScore || 100, schoolId);
    }
    
    console.log('[ASSIGNMENT AI FEEDBACK] Success:', {
      score: result.score,
      feedback: result.feedback.substring(0, 50) + '...',
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[ASSIGNMENT AI FEEDBACK] Error:', error);
    return c.json({ success: false, error: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้' }, 500);
  }
};

export const regenerateAIFeedbackController = async (c: Context) => {
  try {
    const user = c.get('user');
    const submissionId = c.req.param('submissionId');

    if (!submissionId) {
      return c.json({ success: false, error: 'กรุณาระบุ ID การส่งงาน' }, 400);
    }

    const result = await regenerateAIFeedbackForSubmission(submissionId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[REGENERATE AI FEEDBACK] Error:', error);
    return c.json({ success: false, error: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้' }, 500);
  }
};

