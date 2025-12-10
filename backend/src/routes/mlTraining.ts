import { Hono } from 'hono';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getStats,
  getSettings,
  updateSettings,
  train,
  getHistory,
  syncData,
} from '../controllers/mlTrainingController';

const mlTraining = new Hono();

// All routes require authentication and admin role
mlTraining.use('/*', authMiddleware);
mlTraining.use('/*', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'));

// Get ML training statistics
mlTraining.get('/stats', getStats);

// Get ML training settings
mlTraining.get('/settings', getSettings);

// Update ML training settings
mlTraining.put('/settings', updateSettings);

// Train ML model
mlTraining.post('/train', train);

// Get ML training history
mlTraining.get('/history', getHistory);

// Sync existing grading data to MLTrainingData
mlTraining.post('/sync', syncData);

export default mlTraining;
