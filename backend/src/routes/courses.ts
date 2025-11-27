import { Hono } from 'hono';
import { getCoursesController, getCourseByIdController, createCourseController, updateCourseController } from '../controllers/courseController';
import { saveCourseContentController } from '../controllers/lessonController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const courses = new Hono();

courses.use('/*', authMiddleware);

courses.get('/', getCoursesController);
courses.post('/', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createCourseController);
courses.get('/:id', getCourseByIdController);
courses.put('/:id', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateCourseController);
courses.put('/:id/content', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), saveCourseContentController);

export default courses;


