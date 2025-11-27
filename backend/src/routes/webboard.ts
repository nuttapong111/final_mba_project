import { Hono } from 'hono';
import { getPostsController, createPostController, replyPostController } from '../controllers/webboardController';
import { authMiddleware } from '../middleware/auth';

const webboard = new Hono();

webboard.use('/*', authMiddleware);

webboard.get('/courses/:courseId', getPostsController);
webboard.post('/courses/:courseId/posts', createPostController);
webboard.post('/posts/:postId/replies', replyPostController);

export default webboard;


