import { Context } from 'hono';
import { submitExam, createExam, getExamsByCourse, type SubmitExamData, type CreateExamData } from '../services/examService';

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

export const createExamController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    // Validate required fields
    if (!data.courseId || !data.title || !data.type || !data.duration || !data.totalQuestions || !data.totalScore || !data.passingScore || !data.startDate || !data.endDate) {
      return c.json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      }, 400);
    }

    // Convert dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const exam = await createExam({
      courseId: data.courseId,
      title: data.title,
      type: data.type,
      duration: parseInt(data.duration),
      totalQuestions: parseInt(data.totalQuestions),
      totalScore: parseInt(data.totalScore),
      passingScore: parseInt(data.passingScore),
      startDate,
      endDate,
      useRandomQuestions: data.useRandomQuestions || false,
      questionSelections: data.questionSelections || [],
    }, user);

    return c.json({
      success: true,
      data: exam,
      message: 'สร้างข้อสอบสำเร็จ',
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getExamsByCourseController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');

    const exams = await getExamsByCourse(courseId, user);

    return c.json({
      success: true,
      data: exams,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};
