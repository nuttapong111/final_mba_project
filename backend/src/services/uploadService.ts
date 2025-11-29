import { AuthUser } from '../middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadFileToS3, uploadMultipleFilesToS3, UploadResult as S3UploadResult } from './s3Service';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Check if S3 is configured
const isS3Configured = () => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  );
};

// Ensure upload directory exists (fallback for local storage)
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Local file upload (fallback)
const uploadFileLocal = async (
  file: File,
  type: 'video' | 'document' | 'image',
  user: AuthUser
): Promise<UploadResult> => {
  await ensureUploadDir();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ไฟล์ใหญ่เกินไป ขนาดสูงสุด ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
  }

  // Validate file type
  const allowedTypes = 
    type === 'video' ? ALLOWED_VIDEO_TYPES :
    type === 'document' ? ALLOWED_DOCUMENT_TYPES :
    ALLOWED_IMAGE_TYPES;
    
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`ประเภทไฟล์ไม่ถูกต้อง สำหรับ${type === 'video' ? 'วิดีโอ' : type === 'document' ? 'เอกสาร' : 'รูปภาพ'}`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || '';
  const fileName = `${type}_${timestamp}_${randomString}.${extension}`;
  const filePath = join(UPLOAD_DIR, fileName);

  // Convert File to Buffer and save
  console.log(`[UPLOAD] Starting local upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  const startTime = Date.now();
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);
  
  const duration = Date.now() - startTime;
  console.log(`[UPLOAD] Local upload completed: ${file.name} in ${(duration / 1000).toFixed(2)}s`);

  // Generate URL (use full URL if BASE_URL is set, otherwise relative path)
  const baseUrl = process.env.BASE_URL || 
                  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` :
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                  '';
  const url = baseUrl ? `${baseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;
  
  console.log(`[UPLOAD] Generated URL: ${url}`);

  return {
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    s3Key: '', // Not applicable for local storage
  };
};

// Export UploadResult interface (compatible with S3 and local storage)
export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key?: string;
}

/**
 * Upload file - uses S3 if configured, otherwise falls back to local storage
 */
export const uploadFile = async (
  file: File,
  type: 'video' | 'document' | 'image',
  user: AuthUser
): Promise<UploadResult> => {
  try {
    if (isS3Configured()) {
      console.log('[UPLOAD] Using S3 for file upload');
      const result: S3UploadResult = await uploadFileToS3(file, type, user);
      return {
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        s3Key: result.s3Key,
      };
    } else {
      console.log('[UPLOAD] S3 not configured, using local storage');
      return await uploadFileLocal(file, type, user);
    }
  } catch (error: any) {
    console.error('[UPLOAD] Upload service error:', error);
    throw new Error(error.message || 'ไม่สามารถอัพโหลดไฟล์ได้');
  }
};

/**
 * Upload multiple files - uses S3 if configured, otherwise falls back to local storage
 */
export const uploadMultipleFiles = async (
  files: File[],
  type: 'video' | 'document' | 'image',
  user: AuthUser
): Promise<UploadResult[]> => {
  if (isS3Configured()) {
    console.log('[UPLOAD] Using S3 for multiple file upload');
    const results: S3UploadResult[] = await uploadMultipleFilesToS3(files, type, user);
    return results.map(result => ({
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      s3Key: result.s3Key,
    }));
  } else {
    console.log('[UPLOAD] S3 not configured, using local storage');
    const results = await Promise.all(
      files.map(file => uploadFileLocal(file, type, user))
    );
    return results;
  }
};

