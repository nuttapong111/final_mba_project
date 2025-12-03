import { Hono } from 'hono';
import { getAISettingsController, updateAISettingsController } from '../controllers/aiSettingsController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const aiSettings = new Hono();

aiSettings.use('/*', authMiddleware);

// Only admin can access AI settings
aiSettings.get('/', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), getAISettingsController);
aiSettings.put('/', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateAISettingsController);

export default aiSettings;

