import { Context } from 'hono';
import { addStudentToCourse, removeStudentFromCourse } from '../services/courseStudentService';

export const addStudentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const { studentId } = await c.req.json();

    if (!studentId) {
      return c.json({ success: false, error: 'กรุณาระบุ studentId' }, 400);
    }

    const result = await addStudentToCourse(courseId, studentId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const removeStudentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const studentId = c.req.param('studentId');

    await removeStudentFromCourse(courseId, studentId, user);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};


