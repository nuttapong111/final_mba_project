import { Hono } from 'hono';
import { getQuizQuestionsController, submitQuizController, deleteQuizSubmissionController } from '../controllers/quizController';
import { authMiddleware } from '../middleware/auth';

const quiz = new Hono();

quiz.use('/*', authMiddleware);

quiz.get('/content/:contentId/questions', getQuizQuestionsController);
quiz.post('/content/:contentId/submit', submitQuizController);
quiz.delete('/content/:contentId/submission', deleteQuizSubmissionController); // For testing only

export default quiz;

