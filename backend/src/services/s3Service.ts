import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
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
  
  // Log file type for debugging
  console.log(`[S3] File validation - type: ${type}, file.type: ${file.type}, file.name: ${file.name}`);
  console.log(`[S3] Allowed types for ${type}:`, allowedTypes);
  
  // Determine correct MIME type (handle cases where browser sends wrong/empty MIME type)
  let mimeType = file.type;
  if (!mimeType || mimeType === '') {
    // Try to determine MIME type from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    if (extension && mimeTypeMap[extension]) {
      mimeType = mimeTypeMap[extension];
      console.log(`[S3] Detected MIME type from extension: ${mimeType}`);
    }
  }
    
  if (!allowedTypes.includes(mimeType)) {
    // Check if it's a PDF file with wrong MIME type (some browsers send empty or wrong MIME type)
    if (type === 'document' && file.name.toLowerCase().endsWith('.pdf')) {
      console.log(`[S3] PDF file detected but MIME type is "${file.type}", using application/pdf`);
      mimeType = 'application/pdf';
    } else {
      throw new Error(`ประเภทไฟล์ไม่ถูกต้อง สำหรับ${type === 'video' ? 'วิดีโอ' : type === 'document' ? 'เอกสาร' : 'รูปภาพ'}. ไฟล์: ${file.name}, MIME type: ${file.type || 'ไม่ระบุ'}`);
    }
  }

  if (!BUCKET_NAME) {
    console.error('[S3] ❌ Bucket name not configured');
    throw new Error('AWS S3 bucket name is not configured. Please set AWS_S3_BUCKET_NAME environment variable');
  }

  // Validate S3 client credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('[S3] ❌ Missing AWS credentials');
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
  }

  const s3Key = generateS3Key(file, type, user);
  console.log(`[S3] Generated S3 key: ${s3Key}`);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[S3] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to s3://${BUCKET_NAME}/${s3Key}`);
  console.log(`[S3] Using MIME type: ${mimeType}`);
    console.log(`[S3] Region: ${process.env.AWS_REGION || 'ap-southeast-2'}`);
  
  // Sanitize filename for S3 metadata (S3 metadata headers must be ASCII only)
  // Use base64 encoding for non-ASCII characters
  const sanitizeMetadataValue = (value: string): string => {
    // Check if value contains non-ASCII characters
    const hasNonAscii = /[^\x00-\x7F]/.test(value);
    if (hasNonAscii) {
      // Encode to base64 for non-ASCII content
      return Buffer.from(value, 'utf-8').toString('base64');
    }
    // Remove or replace invalid characters for HTTP headers
    return value.replace(/[\r\n\t]/g, ' ').trim();
  };
  
  const sanitizedFileName = sanitizeMetadataValue(file.name);
  const metadata = {
    originalName: sanitizedFileName,
    originalNameEncoded: Buffer.from(file.name, 'utf-8').toString('base64'), // Always store base64 encoded version
    uploadedBy: user.id,
    uploadedAt: new Date().toISOString(),
  };
  
  console.log(`[S3] Original filename: ${file.name}`);
  console.log(`[S3] Sanitized metadata filename: ${sanitizedFileName}`);
  
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
          ContentType: mimeType,
          Metadata: metadata,
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
        ContentType: mimeType,
        Metadata: metadata,
      });

      await s3Client.send(command);
    }

    const duration = Date.now() - startTime;
    console.log(`[S3] ✅ Upload completed: ${file.name} in ${(duration / 1000).toFixed(2)}s`);

    // Generate public URL or use backend proxy for private buckets
    // If AWS_S3_PUBLIC_URL is set, use it directly
    // Otherwise, try direct S3 URL first, fallback to backend proxy for private buckets
    let url: string;
    if (process.env.AWS_S3_PUBLIC_URL) {
      // Public S3 bucket with custom domain
      url = `${process.env.AWS_S3_PUBLIC_URL}/${s3Key}`;
    } else {
      // Try direct S3 URL (works if bucket is public)
      // If bucket is private, frontend will get 403 and can fallback to proxy
      const region = process.env.AWS_REGION || 'ap-southeast-2';
      const directS3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;
      
      // Use backend proxy for more reliable access (handles private buckets)
      const baseUrl = process.env.BASE_URL || 
                      process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` :
                      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                      'http://localhost:3001';
      url = `${baseUrl}/api/files/s3/${s3Key}`;
      
      console.log(`[S3] Direct S3 URL: ${directS3Url}`);
      console.log(`[S3] Proxy URL: ${url}`);
    }

    console.log(`[S3] ✅ Generated URL: ${url}`);

    // Extract generated filename from s3Key (e.g., "uploads/documents/2025/11/document_1764434458100_9pmlffg1emw.pdf" -> "document_1764434458100_9pmlffg1emw.pdf")
    const generatedFileName = s3Key.split('/').pop() || file.name;

    return {
      url,
      fileName: generatedFileName, // เก็บ generated filename (ที่ใช้ใน S3) แทนชื่อไฟล์เดิม
      fileSize: file.size,
      mimeType: mimeType,
      s3Key,
    };
  } catch (error: any) {
    console.error(`[S3] ❌ Upload failed:`);
    console.error(`[S3] Error name: ${error.name}`);
    console.error(`[S3] Error message: ${error.message}`);
    console.error(`[S3] Error code: ${error.Code || error.code || 'N/A'}`);
    if (error.$metadata) {
      console.error(`[S3] Request ID: ${error.$metadata.requestId}`);
      console.error(`[S3] HTTP Status: ${error.$metadata.httpStatusCode}`);
    }
    if (error.stack) {
      console.error(`[S3] Stack: ${error.stack}`);
    }
    throw new Error(`ไม่สามารถอัพโหลดไฟล์ได้: ${error.message || error.Code || 'Unknown error'}`);
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
 * Find file in S3 by filename (searches in common locations)
 */
export const findFileInS3 = async (fileName: string): Promise<string | null> => {
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  try {
    // Try to construct S3 key from filename pattern
    const fileNameMatch = fileName.match(/^(document|video|image)_(\d+)_(.+)\.(.+)$/);
    if (!fileNameMatch) {
      console.log(`[S3] Filename does not match expected pattern: ${fileName}`);
      return null;
    }

    const [, type, timestamp] = fileNameMatch;
    const folder = type === 'video' ? 'videos' : type === 'document' ? 'documents' : 'images';
    
    // Use current date (same as upload logic)
    // Upload uses: new Date() to get year/month, not timestamp from filename
    // Format: uploads/{folder}/{year}/{month}/{fileName}
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Primary S3 key (exact same format as upload)
    const primaryS3Key = `uploads/${folder}/${currentYear}/${currentMonth}/${fileName}`;
    
    // Also try timestamp-based date as fallback (in case file was uploaded in different month/year)
    const dateFromTimestamp = new Date(parseInt(timestamp));
    const yearFromTimestamp = dateFromTimestamp.getFullYear();
    const monthFromTimestamp = String(dateFromTimestamp.getMonth() + 1).padStart(2, '0');
    const fallbackS3Key = `uploads/${folder}/${yearFromTimestamp}/${monthFromTimestamp}/${fileName}`;
    
    // Try possible S3 keys (prioritize current date like upload, then timestamp, then others)
    const possibleKeys = [
      primaryS3Key, // Primary: Current date pattern (exact same as upload)
      fallbackS3Key, // Fallback: Timestamp-based pattern (in case uploaded in different month/year)
      `uploads/${folder}/${currentYear}/${String(parseInt(currentMonth))}/${fileName}`, // Current month without leading zero
      `uploads/${folder}/${yearFromTimestamp}/${String(parseInt(monthFromTimestamp))}/${fileName}`, // Timestamp month without leading zero
    ];

    console.log(`[S3] ========================================`);
    console.log(`[S3] Searching for file: ${fileName}`);
    console.log(`[S3] File type: ${type}, Folder: ${folder}`);
    console.log(`[S3] Primary path (current date, EXACT SAME AS UPLOAD): ${primaryS3Key}`);
    console.log(`[S3] Fallback path (timestamp-based): ${fallbackS3Key}`);
    console.log(`[S3] ========================================`);
    
    for (const s3Key of possibleKeys) {
      try {
        console.log(`[S3] 🔍 Trying S3 key: ${s3Key}`);
        // Use ListObjectsV2 to check if file exists
        const listCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: s3Key,
          MaxKeys: 10, // Check for multiple matches
        });
        
        const response = await s3Client.send(listCommand);
        if (response.Contents && response.Contents.length > 0) {
          console.log(`[S3] Found ${response.Contents.length} object(s) with prefix: ${s3Key}`);
          
          // Find exact match
          const exactMatches = response.Contents.filter((obj: any) => {
            const key = obj.Key || '';
            const isExact = key === s3Key || key.endsWith(`/${fileName}`) || key.endsWith(fileName);
            if (isExact) {
              console.log(`[S3]   - Match: ${key}`);
            }
            return isExact;
          });
          
          if (exactMatches.length === 1) {
            const foundKey = exactMatches[0].Key;
            if (foundKey) {
              console.log(`[S3] ✅ Found exact match (single file): ${foundKey}`);
              return foundKey;
            }
          } else if (exactMatches.length > 1) {
            const firstMatch = exactMatches[0];
            if (firstMatch.Key) {
              console.log(`[S3] ⚠️  Found ${exactMatches.length} matches, using first one: ${firstMatch.Key}`);
              return firstMatch.Key;
            }
          } else {
            console.log(`[S3] ❌ No exact match found for: ${s3Key}`);
            // Log all found keys for debugging
            response.Contents.forEach((obj: any, index: number) => {
              console.log(`[S3]   - Found key ${index + 1}: ${obj.Key}`);
            });
          }
        } else {
          console.log(`[S3] ❌ No objects found with prefix: ${s3Key}`);
        }
      } catch (error: any) {
        console.error(`[S3] ❌ Error checking S3 key ${s3Key}: ${error.message}`);
        // Continue to next possible key
        continue;
      }
    }

    // If exact match not found, try searching by filename only (broader search with pagination)
    console.log(`[S3] ========================================`);
    console.log(`[S3] Exact match not found, searching by filename in uploads/${folder}/`);
    console.log(`[S3] Search prefix: uploads/${folder}/`);
    let continuationToken: string | undefined = undefined;
    const foundKeys: string[] = [];
    let pageCount = 0;
    
    // Search in folder with pagination
    do {
      try {
        pageCount++;
        console.log(`[S3] 🔍 Searching page ${pageCount} in uploads/${folder}/`);
        const searchCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `uploads/${folder}/`,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const searchResponse: ListObjectsV2CommandOutput = await s3Client.send(searchCommand);
        if (searchResponse.Contents) {
          // Log all objects found in this page for debugging
          console.log(`[S3]   - Scanned ${searchResponse.Contents.length} objects in this page`);
          if (searchResponse.Contents.length > 0) {
            console.log(`[S3]   - Objects found in uploads/${folder}/:`);
            searchResponse.Contents.forEach((obj: any, idx: number) => {
              console.log(`[S3]     ${idx + 1}. ${obj.Key}`);
            });
          }
          
          const matches = searchResponse.Contents.filter((obj: any) => {
            const key = obj.Key || '';
            return key.endsWith(fileName) || key.endsWith(`/${fileName}`);
          });
          
          if (matches.length > 0) {
            matches.forEach((match: any) => {
              console.log(`[S3]   - Found match: ${match.Key}`);
              foundKeys.push(match.Key);
            });
          }
        }
        
        continuationToken = searchResponse.NextContinuationToken;
        if (continuationToken) {
          console.log(`[S3]   - More pages available, continuing...`);
        }
      } catch (error: any) {
        console.error(`[S3] ❌ Error searching in folder: ${error.message}`);
        break;
      }
    } while (continuationToken && foundKeys.length === 0);
    
    if (foundKeys.length === 1) {
      console.log(`[S3] ✅ Found single file: ${foundKeys[0]}`);
      return foundKeys[0];
    } else if (foundKeys.length > 1) {
      console.log(`[S3] ⚠️  Found ${foundKeys.length} files with same name:`);
      foundKeys.forEach((key, index) => {
        console.log(`[S3]   ${index + 1}. ${key}`);
      });
      console.log(`[S3] Using first match: ${foundKeys[0]}`);
      return foundKeys[0];
    }
    
    // Last resort: search entire uploads folder with pagination
    console.log(`[S3] ========================================`);
    console.log(`[S3] Searching entire uploads folder for: ${fileName}`);
    console.log(`[S3] Search prefix: uploads/`);
    continuationToken = undefined;
    const foundKeys2: string[] = [];
    pageCount = 0;
    
    do {
      try {
        pageCount++;
        console.log(`[S3] 🔍 Searching page ${pageCount} in uploads/`);
        const broadSearchCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `uploads/`,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });
        
        const broadSearchResponse: ListObjectsV2CommandOutput = await s3Client.send(broadSearchCommand);
        if (broadSearchResponse.Contents) {
          // Log all objects found in this page for debugging
          console.log(`[S3]   - Scanned ${broadSearchResponse.Contents.length} objects in this page`);
          if (broadSearchResponse.Contents.length > 0) {
            console.log(`[S3]   - Objects found in uploads/:`);
            broadSearchResponse.Contents.forEach((obj: any, idx: number) => {
              console.log(`[S3]     ${idx + 1}. ${obj.Key}`);
            });
          }
          
          const matches = broadSearchResponse.Contents.filter((obj: any) => {
            const key = obj.Key || '';
            return key.endsWith(fileName) || key.endsWith(`/${fileName}`);
          });
          
          if (matches.length > 0) {
            matches.forEach((match: any) => {
              console.log(`[S3]   - Found match: ${match.Key}`);
              foundKeys2.push(match.Key);
            });
          }
        }
        
        continuationToken = broadSearchResponse.NextContinuationToken;
        if (continuationToken) {
          console.log(`[S3]   - More pages available, continuing...`);
        }
      } catch (error: any) {
        console.error(`[S3] ❌ Error in broad search: ${error.message}`);
        break;
      }
    } while (continuationToken && foundKeys2.length === 0);
    
    if (foundKeys2.length === 1) {
      console.log(`[S3] ✅ Found single file: ${foundKeys2[0]}`);
      return foundKeys2[0];
    } else if (foundKeys2.length > 1) {
      console.log(`[S3] ⚠️  Found ${foundKeys2.length} files with same name:`);
      foundKeys2.forEach((key, index) => {
        console.log(`[S3]   ${index + 1}. ${key}`);
      });
      console.log(`[S3] Using first match: ${foundKeys2[0]}`);
      return foundKeys2[0];
    }

    console.log(`[S3] ❌ File not found: ${fileName}`);
    return null;
  } catch (error: any) {
    console.error(`[S3] Error searching for file: ${error.message}`);
    return null;
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

