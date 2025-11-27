import { Context } from 'hono';
import { getQuizQuestions } from '../services/quizService';

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

