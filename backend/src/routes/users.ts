import { Hono } from 'hono';
import { getUsersController, createUserController, bulkImportUsersController } from '../controllers/userController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const users = new Hono();

users.use('/*', authMiddleware);

users.get('/', getUsersController);
users.post('/', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), createUserController);
users.post('/bulk-import', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), bulkImportUsersController);

export default users;

