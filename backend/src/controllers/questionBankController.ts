import { Context } from 'hono';
import {
  getQuestionBankByCourse,
  createQuestionCategory,
  updateQuestionCategory,
  deleteQuestionCategory,
} from '../services/questionBankService';

export const getQuestionBankController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const questionBank = await getQuestionBankByCourse(courseId, user);
    return c.json({ success: true, data: questionBank });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createQuestionCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const questionBankId = c.req.param('questionBankId');
    const data = await c.req.json();
    const category = await createQuestionCategory(questionBankId, data, user);
    return c.json({ success: true, data: category });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateQuestionCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const categoryId = c.req.param('categoryId');
    const data = await c.req.json();
    const category = await updateQuestionCategory(categoryId, data, user);
    return c.json({ success: true, data: category });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteQuestionCategoryController = async (c: Context) => {
  try {
    const user = c.get('user');
    const categoryId = c.req.param('categoryId');
    const result = await deleteQuestionCategory(categoryId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

