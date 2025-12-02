import { Hono } from 'hono';
import { getQuizQuestionsController, submitQuizController } from '../controllers/quizController';
import { authMiddleware } from '../middleware/auth';

const quiz = new Hono();

quiz.use('/*', authMiddleware);

quiz.get('/content/:contentId/questions', getQuizQuestionsController);
quiz.post('/content/:contentId/submit', submitQuizController);

export default quiz;

