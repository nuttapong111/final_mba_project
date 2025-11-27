import { Context } from 'hono';
import { uploadFile, uploadMultipleFiles } from '../services/uploadService';

export const uploadFileController = async (c: Context) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'video' | 'document';

    if (!file) {
      return c.json({ success: false, error: 'กรุณาเลือกไฟล์' }, 400);
    }

    if (!type || !['video', 'document'].includes(type)) {
      return c.json({ success: false, error: 'ประเภทไฟล์ไม่ถูกต้อง' }, 400);
    }

    const result = await uploadFile(file, type, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const uploadMultipleFilesController = async (c: Context) => {
  try {
    const user = c.get('user');
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as 'video' | 'document';

    if (!files || files.length === 0) {
      return c.json({ success: false, error: 'กรุณาเลือกไฟล์' }, 400);
    }

    if (!type || !['video', 'document'].includes(type)) {
      return c.json({ success: false, error: 'ประเภทไฟล์ไม่ถูกต้อง' }, 400);
    }

    const results = await uploadMultipleFiles(files, type, user);
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

