import { Context } from 'hono';
import {
  getQuestionBankByCourse,
  createQuestionCategory,
  updateQuestionCategory,
  deleteQuestionCategory,
  getQuestionsByQuestionBank,
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

export const getQuestionsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const questionBankId = c.req.param('questionBankId');
    const categoryId = c.req.query('categoryId');
    const difficulty = c.req.query('difficulty');
    const search = c.req.query('search');

    const questions = await getQuestionsByQuestionBank(
      questionBankId,
      user,
      {
        categoryId: categoryId || undefined,
        difficulty: difficulty || undefined,
        search: search || undefined,
      }
    );
    return c.json({ success: true, data: questions });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

