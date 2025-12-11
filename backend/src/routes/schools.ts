import { Hono } from 'hono';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { getAllSchoolsController, getSchoolByIdController } from '../controllers/schoolController';

const schools = new Hono();

schools.use('/*', authMiddleware);
schools.use('/*', roleMiddleware('SUPER_ADMIN'));

schools.get('/', getAllSchoolsController);
schools.get('/:id', getSchoolByIdController);

export default schools;
