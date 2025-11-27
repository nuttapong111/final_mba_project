import { Context } from 'hono';
import { addTeacherToCourse, removeTeacherFromCourse, updateTeacherRoles } from '../services/courseTeacherService';

export const addTeacherController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const { teacherId, roles } = await c.req.json();

    if (!teacherId || !roles) {
      return c.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, 400);
    }

    const result = await addTeacherToCourse(courseId, teacherId, roles, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const removeTeacherController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const teacherId = c.req.param('teacherId');

    await removeTeacherFromCourse(courseId, teacherId, user);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateTeacherRolesController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const teacherId = c.req.param('teacherId');
    const { roles } = await c.req.json();

    const result = await updateTeacherRoles(courseId, teacherId, roles, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};


