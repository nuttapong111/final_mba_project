import { Context } from 'hono';
import { saveCourseContent, type LessonData } from '../services/lessonService';

export const saveCourseContentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const { lessons } = await c.req.json();

    if (!Array.isArray(lessons)) {
      return c.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    }

    await saveCourseContent(courseId, lessons, user);
    return c.json({ success: true, message: 'บันทึกเนื้อหาหลักสูตรสำเร็จ' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

