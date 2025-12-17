import { Hono } from 'hono';
import { getPostsController, createPostController, replyPostController, getTeacherPostsController, getCourseUsersController } from '../controllers/webboardController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const webboard = new Hono();

webboard.use('/*', authMiddleware);

// Get all posts for a teacher (across all courses)
webboard.get('/teacher/posts', roleMiddleware('TEACHER'), getTeacherPostsController);

webboard.get('/courses/:courseId', getPostsController);
webboard.post('/courses/:courseId/posts', createPostController);
webboard.post('/posts/:postId/replies', replyPostController);
webboard.get('/courses/:courseId/users', getCourseUsersController);

export default webboard;


