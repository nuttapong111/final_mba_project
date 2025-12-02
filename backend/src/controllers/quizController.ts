import { Context } from 'hono';
import { getQuizQuestions, submitQuiz } from '../services/quizService';

export const getQuizQuestionsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const contentId = c.req.param('contentId');
    const result = await getQuizQuestions(contentId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const submitQuizController = async (c: Context) => {
  try {
    const user = c.get('user');
    const contentId = c.req.param('contentId');
    const data = await c.req.json();

    const submission = await submitQuiz(contentId, data, user);

    return c.json({
      success: true,
      data: submission,
      message: 'ส่งข้อสอบสำเร็จ',
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

