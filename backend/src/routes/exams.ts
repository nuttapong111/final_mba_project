import { Hono } from 'hono';
import { submitExamController, createExamController } from '../controllers/examController';
import { authMiddleware } from '../middleware/auth';

const exams = new Hono();

exams.use('/*', authMiddleware);

exams.post('/', createExamController);
exams.post('/:examId/submit', submitExamController);

export default exams;


