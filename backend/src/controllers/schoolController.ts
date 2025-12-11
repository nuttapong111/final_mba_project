import { Context } from 'hono';
import { getAllSchools, getSchoolById, createSchool } from '../services/schoolService';

export const getAllSchoolsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const schools = await getAllSchools(user);
    return c.json({ success: true, data: schools });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getSchoolByIdController = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.param('id');
    const school = await getSchoolById(schoolId, user);
    
    if (!school) {
      return c.json({ success: false, error: 'ไม่พบสถาบัน' }, 404);
    }
    
    return c.json({ success: true, data: school });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createSchoolController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    const school = await createSchool(data, user);
    return c.json({ success: true, data: school });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};
