import { Context } from 'hono';
import { getAssignmentGradingTasks, gradeAssignmentSubmission } from '../services/assignmentGradingService';
import { getAIGradingSuggestion } from '../services/aiService';

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
    
    // Try to extract text from student's submitted file (if PDF)
    let studentAnswer = studentNotes || '';
    const isStudentPDF = studentFileName?.toLowerCase().endsWith('.pdf');
    
    if (isStudentPDF && (studentFileUrl || studentS3Key)) {
      try {
        const { extractTextFromPDFUrl } = await import('../services/pdfService');
        const pdfText = await extractTextFromPDFUrl(
          studentFileUrl || '',
          studentS3Key || null
        );
        
        if (pdfText && pdfText.trim()) {
          studentAnswer = pdfText;
          console.log(`[ASSIGNMENT AI FEEDBACK] Extracted ${pdfText.length} characters from student's PDF`);
        } else {
          studentAnswer = `นักเรียนส่งไฟล์ PDF: ${studentFileName}`;
        }
      } catch (pdfError: any) {
        console.warn(`[ASSIGNMENT AI FEEDBACK] Could not read student's PDF file: ${pdfError.message}`);
        studentAnswer = `นักเรียนส่งไฟล์ PDF: ${studentFileName}\n(ไม่สามารถอ่านเนื้อหาจากไฟล์ได้: ${pdfError.message})`;
      }
    } else if (!studentAnswer) {
      studentAnswer = `นักเรียนส่งไฟล์: ${studentFileName || 'ไฟล์การบ้าน'}`;
    }

    // Get schoolId from user
    const schoolId = user.schoolId || null;
    
    console.log('[ASSIGNMENT AI FEEDBACK] Generating feedback with:', {
      assignmentTitle,
      studentAnswerLength: studentAnswer.length,
      maxScore,
      schoolId,
    });

    const result = await getAIGradingSuggestion(assignmentContext, studentAnswer, maxScore || 100, schoolId);
    
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

