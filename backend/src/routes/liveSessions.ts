import { Hono } from 'hono';
import { getLiveSessionsController } from '../controllers/liveSessionController';
import { authMiddleware } from '../middleware/auth';

const liveSessions = new Hono();

liveSessions.use('/*', authMiddleware);

liveSessions.get('/', getLiveSessionsController);

export default liveSessions;


