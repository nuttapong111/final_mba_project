import { Hono } from 'hono';
import { submitExamController, getExamsByCourseController } from '../controllers/examController';
import { authMiddleware } from '../middleware/auth';

const exams = new Hono();

exams.use('/*', authMiddleware);

exams.get('/courses/:courseId', getExamsByCourseController);
exams.post('/:examId/submit', submitExamController);

export default exams;


