import { Hono } from 'hono';
import { getPresignedUrl } from '../services/s3Service';
import { authMiddleware } from '../middleware/auth';

const files = new Hono();

// Serve files from S3 using presigned URLs
files.get('/s3/*', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const s3Key = c.req.path.replace('/s3/', '');
    
    if (!s3Key) {
      return c.json({ success: false, error: 'File path is required' }, 400);
    }

    console.log(`[FILES] Generating presigned URL for: ${s3Key}`);
    
    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUrl(s3Key, 3600);
    
    // Redirect to presigned URL
    return c.redirect(presignedUrl);
  } catch (error: any) {
    console.error('[FILES] Error generating presigned URL:', error);
    return c.json({ success: false, error: error.message || 'ไม่สามารถเข้าถึงไฟล์ได้' }, 500);
  }
});

export default files;

