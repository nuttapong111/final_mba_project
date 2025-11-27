import { Context } from 'hono';
import {
  getCourseCategories,
  createCourseCategory,
  updateCourseCategory,
  deleteCourseCategory,
} from '../services/courseCategoryService';

export const getCourseCategoriesController = async (c: Context) => {
  try {
    const user = c.get('user');
    const categories = await getCourseCategories(user);
    return c.json({ success: true, data: categories });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};

export const createCourseCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const category = await createCourseCategory(data, user);
    return c.json({ success: true, data: category });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateCourseCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = await c.req.json();
    const category = await updateCourseCategory(id, data, user);
    return c.json({ success: true, data: category });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteCourseCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const result = await deleteCourseCategory(id, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

