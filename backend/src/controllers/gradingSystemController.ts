import { Context } from 'hono';
import {
  getGradingSystem,
  createGradingSystem,
  updateGradingSystem,
  createGradeCriteria,
  updateGradeCriteria,
  deleteGradeCriteria,
  createGradeWeight,
  updateGradeWeight,
  deleteGradeWeight,
  calculateStudentGrade,
} from '../services/gradingService';

export const getGradingSystemController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');

    const result = await getGradingSystem(courseId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createGradingSystemController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const gradingSystem = await createGradingSystem(data, user);
    return c.json({ success: true, data: gradingSystem });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateGradingSystemController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const data = await c.req.json();

    const gradingSystem = await updateGradingSystem(courseId, data, user);
    return c.json({ success: true, data: gradingSystem });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createGradeCriteriaController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const criteria = await createGradeCriteria(data, user);
    return c.json({ success: true, data: criteria });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateGradeCriteriaController = async (c: Context) => {
  try {
    const user = c.get('user');
    const criteriaId = c.req.param('id');
    const data = await c.req.json();

    const criteria = await updateGradeCriteria(criteriaId, data, user);
    return c.json({ success: true, data: criteria });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteGradeCriteriaController = async (c: Context) => {
  try {
    const user = c.get('user');
    const criteriaId = c.req.param('id');

    await deleteGradeCriteria(criteriaId, user);
    return c.json({ success: true, message: 'ลบเกณฑ์การให้เกรดสำเร็จ' });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createGradeWeightController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const weight = await createGradeWeight(data, user);
    return c.json({ success: true, data: weight });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateGradeWeightController = async (c: Context) => {
  try {
    const user = c.get('user');
    const weightId = c.req.param('id');
    const data = await c.req.json();

    const weight = await updateGradeWeight(weightId, data, user);
    return c.json({ success: true, data: weight });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteGradeWeightController = async (c: Context) => {
  try {
    const user = c.get('user');
    const weightId = c.req.param('id');

    await deleteGradeWeight(weightId, user);
    return c.json({ success: true, message: 'ลบน้ำหนักคะแนนสำเร็จ' });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const calculateStudentGradeController = async (c: Context) => {
  try {
    const courseId = c.req.param('courseId');
    const studentId = c.req.param('studentId');

    const result = await calculateStudentGrade(courseId, studentId);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[GRADING] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

