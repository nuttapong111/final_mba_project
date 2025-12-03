import { Context } from 'hono';
import { getGradingTasks, updateGradingTask } from '../services/gradingService';
import { getAIGradingSuggestion } from '../services/aiService';

export const getGradingTasksController = async (c: Context) => {
  try {
    const user = c.get('user');
    const tasks = await getGradingTasks(user);
    return c.json({ success: true, data: tasks });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

export const updateGradingTaskController = async (c: Context) => {
  try {
    const user = c.get('user');
    const taskId = c.req.param('taskId');
    const { teacherScore, teacherFeedback } = await c.req.json();

    if (teacherScore === undefined || !teacherFeedback) {
      return c.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, 400);
    }

    if (teacherScore < 0 || teacherScore > 100) {
      return c.json({ success: false, error: 'คะแนนต้องอยู่ระหว่าง 0-100' }, 400);
    }

    const task = await updateGradingTask(taskId, teacherScore, teacherFeedback, user);
    return c.json({ success: true, data: task });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const generateAIFeedbackController = async (c: Context) => {
  try {
    const user = c.get('user');
    const { question, answer, maxScore } = await c.req.json();

    if (!question || !answer) {
      return c.json({ success: false, error: 'กรุณาระบุคำถามและคำตอบ' }, 400);
    }

    // Get schoolId from user
    const schoolId = user.schoolId || null;
    
    console.log('[AI FEEDBACK] Generating feedback with:', {
      question: question.substring(0, 50) + '...',
      answer: answer.substring(0, 50) + '...',
      maxScore,
      schoolId,
    });

    const result = await getAIGradingSuggestion(question, answer, maxScore || 100, schoolId);
    
    console.log('[AI FEEDBACK] Success:', {
      score: result.score,
      feedback: result.feedback.substring(0, 50) + '...',
    });
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[AI FEEDBACK] Error:', error);
    return c.json({ success: false, error: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้' }, 500);
  }
};


