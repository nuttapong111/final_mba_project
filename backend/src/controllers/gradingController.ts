import { Context } from 'hono';
import { getGradingTasks, updateGradingTask } from '../services/gradingService';

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


