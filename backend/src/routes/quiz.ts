import { Hono } from 'hono';
import { getQuizQuestionsController } from '../controllers/quizController';
import { authMiddleware } from '../middleware/auth';

const quiz = new Hono();

quiz.use('/*', authMiddleware);

quiz.get('/content/:contentId/questions', getQuizQuestionsController);

export default quiz;

