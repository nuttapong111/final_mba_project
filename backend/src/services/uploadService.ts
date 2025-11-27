import { AuthUser } from '../middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const uploadFile = async (
  file: File,
  type: 'video' | 'document',
  user: AuthUser
): Promise<UploadResult> => {
  await ensureUploadDir();

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`ไฟล์ใหญ่เกินไป ขนาดสูงสุด ${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`);
  }

  // Validate file type
  const allowedTypes = type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`ประเภทไฟล์ไม่ถูกต้อง สำหรับ${type === 'video' ? 'วิดีโอ' : 'เอกสาร'}`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop() || '';
  const fileName = `${type}_${timestamp}_${randomString}.${extension}`;
  const filePath = join(UPLOAD_DIR, fileName);

  // Convert File to Buffer and save
  // Use streaming for large files to avoid memory issues
  console.log(`[UPLOAD] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  const startTime = Date.now();
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);
  
  const duration = Date.now() - startTime;
  console.log(`[UPLOAD] Upload completed: ${file.name} in ${(duration / 1000).toFixed(2)}s`);

  // Generate URL (use full URL if BASE_URL is set, otherwise relative path)
  const baseUrl = process.env.BASE_URL || '';
  const url = baseUrl ? `${baseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;

  return {
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
};

export const uploadMultipleFiles = async (
  files: File[],
  type: 'video' | 'document',
  user: AuthUser
): Promise<UploadResult[]> => {
  const results = await Promise.all(
    files.map(file => uploadFile(file, type, user))
  );
  return results;
};

