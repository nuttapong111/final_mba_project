import { Hono } from 'hono';
import { getGradingTasksController, updateGradingTaskController, generateAIFeedbackController } from '../controllers/gradingController';
import {
  getGradingSystemController,
  createGradingSystemController,
  updateGradingSystemController,
  createGradeCriteriaController,
  updateGradeCriteriaController,
  deleteGradeCriteriaController,
  createGradeWeightController,
  updateGradeWeightController,
  deleteGradeWeightController,
  calculateStudentGradeController,
  getStudentGradeReportController,
} from '../controllers/gradingSystemController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const grading = new Hono();

grading.use('/*', authMiddleware);

// Old grading tasks routes (keep for backward compatibility)
grading.get('/tasks', roleMiddleware('TEACHER'), getGradingTasksController);
grading.patch('/tasks/:taskId', roleMiddleware('TEACHER'), updateGradingTaskController);
grading.post('/ai/feedback', roleMiddleware('TEACHER'), generateAIFeedbackController);

// New grading system routes
grading.get('/courses/:courseId/system', getGradingSystemController);
grading.post('/system', createGradingSystemController);
grading.put('/courses/:courseId/system', updateGradingSystemController);

// Grade criteria routes
grading.post('/criteria', createGradeCriteriaController);
grading.put('/criteria/:id', updateGradeCriteriaController);
grading.delete('/criteria/:id', deleteGradeCriteriaController);

// Grade weight routes
grading.post('/weights', createGradeWeightController);
grading.put('/weights/:id', updateGradeWeightController);
grading.delete('/weights/:id', deleteGradeWeightController);

// Calculate student grade
grading.get('/courses/:courseId/students/:studentId/grade', calculateStudentGradeController);

// Get student grade report
grading.get('/courses/:courseId/students/:studentId/report', getStudentGradeReportController);

export default grading;


