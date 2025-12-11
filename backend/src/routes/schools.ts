import { Hono } from 'hono';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { getAllSchoolsController, getSchoolByIdController, createSchoolController } from '../controllers/schoolController';

const schools = new Hono();

schools.use('/*', authMiddleware);
schools.use('/*', roleMiddleware('SUPER_ADMIN'));

schools.get('/', getAllSchoolsController);
schools.get('/:id', getSchoolByIdController);
schools.post('/', createSchoolController);

export default schools;
