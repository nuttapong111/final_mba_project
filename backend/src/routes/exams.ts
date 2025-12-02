import { Hono } from 'hono';
import { submitExamController, createExamController, getExamsByCourseController } from '../controllers/examController';
import { authMiddleware } from '../middleware/auth';

const exams = new Hono();

exams.use('/*', authMiddleware);

exams.post('/', createExamController);
exams.get('/courses/:courseId', getExamsByCourseController);
exams.post('/:examId/submit', submitExamController);

export default exams;


