import { Hono } from 'hono';
import { getGradingTasksController, updateGradingTaskController } from '../controllers/gradingController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const grading = new Hono();

grading.use('/*', authMiddleware);
grading.use('/*', roleMiddleware('TEACHER'));

grading.get('/tasks', getGradingTasksController);
grading.patch('/tasks/:taskId', updateGradingTaskController);

export default grading;


