import { Hono } from 'hono';
import {
  getAssignmentsController,
  getAssignmentByIdController,
  createAssignmentController,
  updateAssignmentController,
  deleteAssignmentController,
  submitAssignmentController,
  gradeAssignmentController,
} from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/auth';

const assignments = new Hono();

assignments.use('/*', authMiddleware);

// Get all assignments for a course
assignments.get('/courses/:courseId', getAssignmentsController);

// Get assignment by ID
assignments.get('/:id', getAssignmentByIdController);

// Create assignment (admin/teacher only)
assignments.post('/', createAssignmentController);

// Update assignment (admin/teacher only)
assignments.put('/:id', updateAssignmentController);

// Delete assignment (admin/teacher only)
assignments.delete('/:id', deleteAssignmentController);

// Submit assignment (student only)
assignments.post('/:id/submit', submitAssignmentController);

// Grade assignment (teacher/admin only)
assignments.post('/submissions/:submissionId/grade', gradeAssignmentController);

export default assignments;

