import { Context } from 'hono';
import { getAISettings, updateAISettings } from '../services/aiSettingsService';

export const getAISettingsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || null;

    const settings = await getAISettings(schoolId, user);
    return c.json({ success: true, data: settings });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updateAISettingsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || null;
    const data = await c.req.json();

    const settings = await updateAISettings(schoolId, data, user);
    return c.json({ success: true, data: settings });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

