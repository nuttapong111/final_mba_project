// Don't require pdf-parse at top level to avoid DOMMatrix errors
// Will use dynamic import only when needed
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

/**
 * Extract text from PDF file
 */
export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    // Use dynamic import to avoid loading pdf-parse at module load time
    // This prevents DOMMatrix errors when the module is imported
    const pdfParse = (await import('pdf-parse')).default || require('pdf-parse');
    
    if (typeof pdfParse !== 'function') {
      throw new Error('PDF parsing library is not available');
    }
    
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error: any) {
    console.error('[PDF] Error extracting text from PDF:', error);
    
    // Check for browser-specific errors
    if (error.message?.includes('DOMMatrix') || 
        error.message?.includes('canvas') ||
        error.message?.includes('browser')) {
      throw new Error(`PDF parsing library requires browser environment: ${error.message}`);
    }
    
    throw new Error(`ไม่สามารถอ่านไฟล์ PDF ได้: ${error.message}`);
  }
};

/**
 * Download file from URL (supports both HTTP and S3)
 */
export const downloadFile = async (url: string, s3Key?: string | null): Promise<Buffer> => {
  try {
    // If S3 key is provided, download from S3
    if (s3Key && BUCKET_NAME) {
      console.log(`[PDF] Downloading from S3: ${s3Key}`);
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
      });
      
      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];
      
      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }
      
      return Buffer.concat(chunks);
    }
    
    // If URL is a local file path
    if (url.startsWith('/uploads/')) {
      const fileName = url.replace('/uploads/', '');
      const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
      const filePath = join(uploadDir, fileName);
      
      if (existsSync(filePath)) {
        console.log(`[PDF] Reading local file: ${filePath}`);
        return await readFile(filePath);
      } else {
        throw new Error(`ไฟล์ไม่พบ: ${filePath}`);
      }
    }
    
    // If URL is HTTP/HTTPS, download from URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log(`[PDF] Downloading from URL: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    
    throw new Error(`รูปแบบ URL ไม่รองรับ: ${url}`);
  } catch (error: any) {
    console.error('[PDF] Error downloading file:', error);
    throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${error.message}`);
  }
};

/**
 * Extract text from PDF file by URL
 */
export const extractTextFromPDFUrl = async (
  url: string,
  s3Key?: string | null
): Promise<string> => {
  try {
    // Check if file is PDF
    const isPDF = url.toLowerCase().endsWith('.pdf') || 
                  (s3Key && s3Key.toLowerCase().endsWith('.pdf'));
    
    if (!isPDF) {
      throw new Error('ไฟล์ไม่ใช่ PDF');
    }
    
    // Download file
    const buffer = await downloadFile(url, s3Key);
    
    // Extract text
    const text = await extractTextFromPDF(buffer);
    
    console.log(`[PDF] Extracted ${text.length} characters from PDF`);
    return text;
  } catch (error: any) {
    console.error('[PDF] Error extracting text from PDF URL:', error);
    throw error;
  }
};

