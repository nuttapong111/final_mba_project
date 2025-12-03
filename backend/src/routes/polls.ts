import { Hono } from 'hono';
import {
  getPollsController,
  createPollController,
  updatePollController,
  deletePollController,
  submitPollController,
  getPollResponseStatusController,
} from '../controllers/pollController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const polls = new Hono();

polls.use('/*', authMiddleware);

polls.get('/courses/:courseId', getPollsController);
polls.post('/courses/:courseId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createPollController);
polls.put('/:pollId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updatePollController);
polls.delete('/:pollId', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), deletePollController);
polls.get('/:pollId/status', getPollResponseStatusController);
polls.post('/:pollId/submit', submitPollController);

export default polls;

