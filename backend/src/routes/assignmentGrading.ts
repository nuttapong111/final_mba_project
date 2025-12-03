import { Hono } from 'hono';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getAssignmentGradingTasksController,
  gradeAssignmentSubmissionController,
  generateAssignmentAIFeedbackController,
} from '../controllers/assignmentGradingController';

const assignmentGrading = new Hono();

assignmentGrading.use('/*', authMiddleware);

// Get all assignment grading tasks
assignmentGrading.get('/tasks', roleMiddleware('TEACHER'), getAssignmentGradingTasksController);

// Grade an assignment submission
assignmentGrading.patch('/tasks/:submissionId', roleMiddleware('TEACHER'), gradeAssignmentSubmissionController);

// Generate AI feedback for assignment
assignmentGrading.post('/ai-feedback', roleMiddleware('TEACHER'), generateAssignmentAIFeedbackController);

export default assignmentGrading;

