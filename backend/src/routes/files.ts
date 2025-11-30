import { Hono } from 'hono';
import { getPresignedUrl, findFileInS3 } from '../services/s3Service';
import { authMiddleware } from '../middleware/auth';
import prisma from '../config/database';

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

// Find file in S3 by contentId (for legacy files with /uploads/ URL)
files.get('/find-by-content/:contentId', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const contentId = c.req.param('contentId');
    
    if (!contentId) {
      return c.json({ success: false, error: 'Content ID is required' }, 400);
    }

    console.log(`[FILES] Finding file for content: ${contentId}`);
    
    // Find content in database
    const content = await prisma.lessonContent.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        type: true,
      },
    });

    if (!content || !content.fileUrl) {
      return c.json({ success: false, error: 'Content or file URL not found' }, 404);
    }

    console.log(`[FILES] Content fileUrl: ${content.fileUrl}`);
    
    // If fileUrl is already an S3 URL or proxy URL, return it
    if (content.fileUrl.startsWith('http://') || content.fileUrl.startsWith('https://')) {
      return c.json({ success: true, url: content.fileUrl });
    }
    
    // If fileUrl is /uploads/... try to find in S3
    if (content.fileUrl.startsWith('/uploads/')) {
      const fileName = content.fileUrl.replace('/uploads/', '').split('/').pop() || content.fileUrl.replace('/uploads/', '');
      
      console.log(`[FILES] Searching for file in S3: ${fileName}`);
      
      // Use findFileInS3 to search for the file
      const s3Key = await findFileInS3(fileName);
      
      if (s3Key) {
        try {
          const presignedUrl = await getPresignedUrl(s3Key, 3600);
          console.log(`[FILES] ✅ Found file in S3 at ${s3Key}, returning presigned URL`);
          return c.json({ success: true, url: presignedUrl });
        } catch (s3Error: any) {
          console.error(`[FILES] ❌ Error generating presigned URL for ${s3Key}: ${s3Error.message}`);
          return c.json({ 
            success: false, 
            error: `ไม่สามารถสร้าง URL สำหรับไฟล์ได้: ${s3Error.message}` 
          }, 500);
        }
      } else {
        console.log(`[FILES] ❌ File not found in S3: ${fileName}`);
        return c.json({ 
          success: false, 
          error: 'File not found in S3. Please contact administrator to update the file URL.' 
        }, 404);
      }
    }
    
    return c.json({ success: false, error: 'Unable to determine file location' }, 404);
  } catch (error: any) {
    console.error('[FILES] Error finding file:', error);
    return c.json({ success: false, error: error.message || 'ไม่สามารถค้นหาไฟล์ได้' }, 500);
  }
});

export default files;

