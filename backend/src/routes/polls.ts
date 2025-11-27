import { Hono } from 'hono';
import {
  getPollsController,
  createPollController,
  updatePollController,
  deletePollController,
} from '../controllers/pollController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const polls = new Hono();

polls.use('/*', authMiddleware);

polls.get('/courses/:courseId', getPollsController);
polls.post('/courses/:courseId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createPollController);
polls.put('/:pollId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updatePollController);
polls.delete('/:pollId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), deletePollController);

export default polls;

