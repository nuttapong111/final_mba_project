import { Context } from 'hono';
import { submitExam, type SubmitExamData } from '../services/examService';

export const submitExamController = async (c: Context) => {
  try {
    const user = c.get('user');
    const examId = c.req.param('examId');
    const data = await c.req.json();

    const submission = await submitExam(
      {
        examId,
        answers: data.answers || [],
        timeSpent: data.timeSpent,
      },
      user
    );

    return c.json({
      success: true,
      data: submission,
      message: 'ส่งข้อสอบสำเร็จ',
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

