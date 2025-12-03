import { Context } from 'hono';
import { getAssignmentGradingTasks, gradeAssignmentSubmission } from '../services/assignmentGradingService';

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

