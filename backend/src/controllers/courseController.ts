import { Context } from 'hono';
import { getCourses, getCourseById, createCourse, updateCourse } from '../services/courseService';

export const getCoursesController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courses = await getCourses(user);
    return c.json({ success: true, data: courses });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

export const getCourseByIdController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const course = await getCourseById(courseId, user);
    return c.json({ success: true, data: course });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 404);
  }
};

export const createCourseController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const course = await createCourse(data, user);
    return c.json({ success: true, data: course });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateCourseController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('id');
    const data = await c.req.json();
    const course = await updateCourse(courseId, data, user);
    return c.json({ success: true, data: course });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};
