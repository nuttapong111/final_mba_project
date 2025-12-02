import { Context } from 'hono';
import { getQuizQuestions, submitQuiz, deleteQuizSubmission } from '../services/quizService';

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

    console.log('[submitQuizController] Received data:', {
      contentId,
      answersCount: data.answers?.length || 0,
      timeSpent: data.timeSpent,
      userId: user.id,
    });

    const submission = await submitQuiz(contentId, data, user);

    return c.json({
      success: true,
      data: submission,
      message: 'ส่งข้อสอบสำเร็จ',
    });
  } catch (error: any) {
    console.error('[submitQuizController] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteQuizSubmissionController = async (c: Context) => {
  try {
    const user = c.get('user');
    const contentId = c.req.param('contentId');

    const result = await deleteQuizSubmission(contentId, user);

    return c.json({
      success: true,
      data: result,
      message: 'ลบการส่งข้อสอบสำเร็จ',
    });
  } catch (error: any) {
    console.error('[deleteQuizSubmissionController] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

