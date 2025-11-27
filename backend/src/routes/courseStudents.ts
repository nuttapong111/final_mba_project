import { Hono } from 'hono';
import { addStudentController, removeStudentController } from '../controllers/courseStudentController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const courseStudents = new Hono();

courseStudents.use('/*', authMiddleware);
courseStudents.use('/*', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'));

courseStudents.post('/:id/students', addStudentController);
courseStudents.delete('/:id/students/:studentId', removeStudentController);

export default courseStudents;


