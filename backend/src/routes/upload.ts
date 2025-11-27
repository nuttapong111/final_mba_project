import { Hono } from 'hono';
import { uploadFileController, uploadMultipleFilesController } from '../controllers/uploadController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const upload = new Hono();

upload.use('/*', authMiddleware);

upload.post('/file', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), uploadFileController);
upload.post('/files', roleMiddleware('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), uploadMultipleFilesController);

export default upload;


