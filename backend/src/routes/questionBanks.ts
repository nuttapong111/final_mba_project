import { Hono } from 'hono';
import {
  getQuestionBankController,
  createQuestionCategoryController,
  updateQuestionCategoryController,
  deleteQuestionCategoryController,
} from '../controllers/questionBankController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const questionBanks = new Hono();

questionBanks.use('/*', authMiddleware);

questionBanks.get('/courses/:courseId', getQuestionBankController);
questionBanks.post('/:questionBankId/categories', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createQuestionCategoryController);
questionBanks.put('/categories/:categoryId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateQuestionCategoryController);
questionBanks.delete('/categories/:categoryId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), deleteQuestionCategoryController);

export default questionBanks;

