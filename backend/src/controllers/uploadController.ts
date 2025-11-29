import { Context } from 'hono';
import { uploadFile, uploadMultipleFiles } from '../services/uploadService';

export const uploadFileController = async (c: Context) => {
  try {
    const startTime = Date.now();
    const user = c.get('user');
    
    console.log('[UPLOAD] ========== Upload Request Started ==========');
    console.log('[UPLOAD] User:', user?.id, user?.role);
    console.log('[UPLOAD] Headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers.entries())));
    
    const formData = await c.req.formData();
    console.log('[UPLOAD] FormData keys:', Array.from(formData.keys()));
    
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'video' | 'document' | 'image';

    console.log('[UPLOAD] File:', file ? {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    } : 'null');
    console.log('[UPLOAD] Type:', type);

    if (!file) {
      console.error('[UPLOAD] ❌ No file provided');
      return c.json({ success: false, error: 'กรุณาเลือกไฟล์' }, 400);
    }

    if (!type || !['video', 'document', 'image'].includes(type)) {
      console.error('[UPLOAD] ❌ Invalid type:', type);
      return c.json({ success: false, error: `ประเภทไฟล์ไม่ถูกต้อง: ${type || 'ไม่ระบุ'}. ต้องเป็น video, document, หรือ image` }, 400);
    }

    console.log(`[UPLOAD] ✅ File validated: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)} MB, upload type: ${type}`);
    
    const result = await uploadFile(file, type, user);
    
    const duration = Date.now() - startTime;
    console.log(`[UPLOAD] ✅ Upload successful in ${(duration / 1000).toFixed(2)}s`);
    console.log(`[UPLOAD] Result URL: ${result.url}`);
    console.log('[UPLOAD] ========== Upload Request Completed ==========\n');
    
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[UPLOAD] ❌ ========== Upload Error ==========');
    console.error('[UPLOAD] Error name:', error.name);
    console.error('[UPLOAD] Error message:', error.message);
    console.error('[UPLOAD] Error stack:', error.stack);
    if (error.cause) {
      console.error('[UPLOAD] Error cause:', error.cause);
    }
    console.error('[UPLOAD] ===========================================\n');
    
    return c.json({ 
      success: false, 
      error: error.message || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' 
    }, 400);
  }
};

export const uploadMultipleFilesController = async (c: Context) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as 'video' | 'document' | 'image';

    if (!files || files.length === 0) {
      return c.json({ success: false, error: 'กรุณาเลือกไฟล์' }, 400);
    }

    if (!type || !['video', 'document', 'image'].includes(type)) {
      return c.json({ success: false, error: 'ประเภทไฟล์ไม่ถูกต้อง' }, 400);
    }

    const results = await uploadMultipleFiles(files, type, user);
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

