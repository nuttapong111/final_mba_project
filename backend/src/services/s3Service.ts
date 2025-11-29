import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthUser } from '../middleware/auth';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
}

/**
 * Generate S3 key (path) for uploaded file
 */
const generateS3Key = (file: File, type: 'video' | 'document' | 'image', user: AuthUser): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || '';
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${type}_${timestamp}_${randomString}.${extension}`;
  
  // Organize by type and date: uploads/videos/2024/01/filename.mp4
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const folder = type === 'video' ? 'videos' : type === 'document' ? 'documents' : 'images';
  
  return `uploads/${folder}/${year}/${month}/${fileName}`;
};

/**
 * Upload file to S3
 */
export const uploadFileToS3 = async (
  file: File,
  type: 'video' | 'document' | 'image',
  user: AuthUser
): Promise<UploadResult> => {
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

  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  const s3Key = generateS3Key(file, type, user);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[S3] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to s3://${BUCKET_NAME}/${s3Key}`);
  const startTime = Date.now();

  try {
    // Use multipart upload for large files (>5MB)
    if (file.size > 5 * 1024 * 1024) {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            originalName: file.name,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString(),
          },
        },
        partSize: 5 * 1024 * 1024, // 5MB per part
      });

      await upload.done();
    } else {
      // Use simple PutObject for smaller files
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedBy: user.id,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);
    }

    const duration = Date.now() - startTime;
    console.log(`[S3] Upload completed: ${file.name} in ${(duration / 1000).toFixed(2)}s`);

    // Generate public URL or presigned URL
    const url = process.env.AWS_S3_PUBLIC_URL 
      ? `${process.env.AWS_S3_PUBLIC_URL}/${s3Key}`
      : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${s3Key}`;

    console.log(`[S3] Generated URL: ${url}`);

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      s3Key,
    };
  } catch (error: any) {
    console.error(`[S3] Upload failed: ${error.message}`);
    throw new Error(`ไม่สามารถอัพโหลดไฟล์ได้: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 */
export const uploadMultipleFilesToS3 = async (
  files: File[],
  type: 'video' | 'document' | 'image',
  user: AuthUser
): Promise<UploadResult[]> => {
  const results = await Promise.all(
    files.map(file => uploadFileToS3(file, type, user))
  );
  return results;
};

/**
 * Delete file from S3
 */
export const deleteFileFromS3 = async (s3Key: string): Promise<void> => {
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    console.log(`[S3] Deleted file: ${s3Key}`);
  } catch (error: any) {
    console.error(`[S3] Delete failed: ${error.message}`);
    throw new Error(`ไม่สามารถลบไฟล์ได้: ${error.message}`);
  }
};

/**
 * Get presigned URL for private file access
 */
export const getPresignedUrl = async (s3Key: string, expiresIn: number = 3600): Promise<string> => {
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    console.error(`[S3] Presigned URL generation failed: ${error.message}`);
    throw new Error(`ไม่สามารถสร้าง URL ได้: ${error.message}`);
  }
};

