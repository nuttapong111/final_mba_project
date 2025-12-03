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
    const { assignmentTitle, assignmentDescription, studentNotes, maxScore } = await c.req.json();

    if (!assignmentTitle) {
      return c.json({ success: false, error: 'กรุณาระบุชื่อการบ้าน' }, 400);
    }

    // Create a prompt for AI based on assignment details
    const question = `การบ้าน: ${assignmentTitle}${assignmentDescription ? `\nคำอธิบาย: ${assignmentDescription}` : ''}`;
    const answer = studentNotes || 'นักเรียนส่งไฟล์การบ้านมาแล้ว กรุณาตรวจสอบไฟล์ที่แนบมา';

    // Get schoolId from user
    const schoolId = user.schoolId || null;
    
    console.log('[ASSIGNMENT AI FEEDBACK] Generating feedback with:', {
      assignmentTitle,
      studentNotes: studentNotes?.substring(0, 50) + '...',
      maxScore,
      schoolId,
    });

    const result = await getAIGradingSuggestion(question, answer, maxScore || 100, schoolId);
    
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

