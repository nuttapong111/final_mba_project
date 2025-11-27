import { Hono } from 'hono';
import {
  getCourseCategoriesController,
  createCourseCategoryController,
  updateCourseCategoryController,
  deleteCourseCategoryController,
} from '../controllers/courseCategoryController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const courseCategories = new Hono();

courseCategories.use('/*', authMiddleware);

courseCategories.get('/', getCourseCategoriesController);
courseCategories.post('/', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createCourseCategoryController);
courseCategories.put('/:id', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateCourseCategoryController);
courseCategories.delete('/:id', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), deleteCourseCategoryController);

export default courseCategories;

