import { Hono } from 'hono';
import {
  getSchoolDashboardController,
  getAdminDashboardController,
  getTeacherDashboardController,
  getStudentDashboardController,
} from '../controllers/dashboardController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const dashboard = new Hono();

dashboard.use('/*', authMiddleware);

dashboard.get('/school', roleMiddleware('SCHOOL_ADMIN'), getSchoolDashboardController);
dashboard.get('/admin', roleMiddleware('SUPER_ADMIN'), getAdminDashboardController);
dashboard.get('/teacher', roleMiddleware('TEACHER'), getTeacherDashboardController);
dashboard.get('/student', roleMiddleware('STUDENT'), getStudentDashboardController);

export default dashboard;


