import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { roleMiddleware } from '../middleware/role';
import {
  getContentProgressController,
  updateVideoProgressController,
  markContentCompletedController,
  getCourseProgressController,
} from '../controllers/contentProgressController';

const contentProgress = new Hono();

contentProgress.use('/*', authMiddleware);
contentProgress.use('/*', roleMiddleware('STUDENT'));

// Get progress for a specific content
contentProgress.get('/content/:contentId', getContentProgressController);

// Update video progress
contentProgress.post('/video', updateVideoProgressController);

// Mark content as completed
contentProgress.post('/complete', markContentCompletedController);

// Get all progress for a course
contentProgress.get('/course/:courseId', getCourseProgressController);

export default contentProgress;

