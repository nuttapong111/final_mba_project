import { Hono } from 'hono';
import { loginController, registerController, meController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono();

auth.post('/login', loginController);
auth.post('/register', registerController);
auth.get('/me', authMiddleware, meController);

export default auth;


