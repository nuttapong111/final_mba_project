import { Context } from 'hono';
import {
  getAssignmentsByCourse,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignment,
} from '../services/assignmentService';

export const getAssignmentsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');

    const assignments = await getAssignmentsByCourse(courseId, user);
    return c.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const getAssignmentByIdController = async (c: Context) => {
  try {
    const user = c.get('user');
    const assignmentId = c.req.param('id');

    const assignment = await getAssignmentById(assignmentId, user);
    return c.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createAssignmentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();

    const assignment = await createAssignment(data, user);
    return c.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateAssignmentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const assignmentId = c.req.param('id');
    const data = await c.req.json();

    const assignment = await updateAssignment(assignmentId, data, user);
    return c.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deleteAssignmentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const assignmentId = c.req.param('id');

    await deleteAssignment(assignmentId, user);
    return c.json({ success: true, message: 'ลบการบ้านสำเร็จ' });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const submitAssignmentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const assignmentId = c.req.param('id');
    const { fileUrl, fileName, fileSize, s3Key } = await c.req.json();

    if (!fileUrl || !fileName) {
      return c.json({ success: false, error: 'กรุณาแนบไฟล์' }, 400);
    }

    const submission = await submitAssignment(assignmentId, fileUrl, fileName, fileSize || 0, s3Key, user);
    return c.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const gradeAssignmentController = async (c: Context) => {
  try {
    const user = c.get('user');
    const submissionId = c.req.param('submissionId');
    const { score, feedback } = await c.req.json();

    if (score === undefined || score === null) {
      return c.json({ success: false, error: 'กรุณาระบุคะแนน' }, 400);
    }

    const submission = await gradeAssignment(submissionId, score, feedback, user);
    return c.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('[ASSIGNMENT] Error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
};

