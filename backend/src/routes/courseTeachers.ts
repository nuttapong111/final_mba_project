import { Hono } from 'hono';
import { addTeacherController, removeTeacherController, updateTeacherRolesController } from '../controllers/courseTeacherController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const courseTeachers = new Hono();

courseTeachers.use('/*', authMiddleware);
courseTeachers.use('/*', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'));

courseTeachers.post('/:id/teachers', addTeacherController);
courseTeachers.delete('/:id/teachers/:teacherId', removeTeacherController);
courseTeachers.patch('/:id/teachers/:teacherId/roles', updateTeacherRolesController);

export default courseTeachers;


