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
      submissionId,
      assignmentTitle, 
      assignmentDescription, 
      studentNotes, 
      maxScore,
      studentFileUrl,
      studentS3Key,
      studentFileName,
      teacherFileUrl,
      teacherS3Key,
      teacherFileName: teacherFileNameParam
    } = await c.req.json() as {
      submissionId?: string;
      assignmentTitle: string;
      assignmentDescription?: string;
      studentNotes?: string;
      maxScore?: number;
      studentFileUrl?: string;
      studentS3Key?: string;
      studentFileName?: string;
      teacherFileUrl?: string;
      teacherS3Key?: string;
      teacherFileName?: string;
    };
    
    const teacherFileName = teacherFileNameParam;

    if (!assignmentTitle) {
      return c.json({ success: false, error: 'กรุณาระบุชื่อการบ้าน' }, 400);
    }

    // Build assignment context (question + description + teacher's file if exists)
    let assignmentContext = `การบ้าน: ${assignmentTitle}`;
    if (assignmentDescription) {
      assignmentContext += `\nคำอธิบาย: ${assignmentDescription}`;
    }
    
    // Note: Skip extracting text from teacher's PDF file to avoid DOMMatrix errors
    // Teacher's PDF file URL will be passed to Gemini File API if needed
    if (teacherFileUrl || teacherS3Key) {
      if (teacherFileName) {
        assignmentContext += `\n\nอาจารย์ได้แนบไฟล์: ${teacherFileName}`;
        console.log(`[ASSIGNMENT AI FEEDBACK] Teacher attached file: ${teacherFileName}`);
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
      // Pass teacher's PDF file if available
      result = await getAIGradingSuggestionWithPDF(
        assignmentContext,
          studentFileUrl || '',
        studentS3Key || null,
        maxScore || 100,
        schoolId,
        undefined, // geminiApiKey
        teacherFileUrl || undefined,
        teacherS3Key || null
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
    
    // Save AI feedback to database if submissionId is provided
    if (submissionId) {
      try {
        const prisma = (await import('../config/database')).default;
        await prisma.assignmentSubmission.update({
          where: { id: submissionId },
          data: {
            aiScore: result.score,
            aiFeedback: result.feedback,
          },
        });
        console.log('[ASSIGNMENT AI FEEDBACK] AI feedback saved to database for submission:', submissionId);
      } catch (dbError: any) {
        console.error('[ASSIGNMENT AI FEEDBACK] Error saving to database:', dbError);
        // Continue even if database save fails - return the result anyway
      }
    }
    
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

