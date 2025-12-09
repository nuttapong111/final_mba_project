import { Context } from 'hono';
import {
  getMLTrainingStats,
  getMLTrainingSettings,
  updateMLTrainingSettings,
  trainMLModel,
  getMLTrainingHistory,
} from '../services/mlTrainingService';

/**
 * Get ML training statistics
 * GET /api/ml-training/stats?schoolId=xxx
 */
export const getStats = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || undefined;

    const stats = await getMLTrainingStats(schoolId || null, user);

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[ML TRAINING] Error getting stats:', error);
    return c.json({
      success: false,
      error: error.message || 'ไม่สามารถดึงสถิติได้',
    }, 400);
  }
};

/**
 * Get ML training settings
 * GET /api/ml-training/settings?schoolId=xxx
 */
export const getSettings = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || undefined;

    const settings = await getMLTrainingSettings(schoolId || null, user);

    return c.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('[ML TRAINING] Error getting settings:', error);
    return c.json({
      success: false,
      error: error.message || 'ไม่สามารถดึงการตั้งค่าได้',
    }, 400);
  }
};

/**
 * Update ML training settings
 * PUT /api/ml-training/settings?schoolId=xxx
 */
export const updateSettings = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || undefined;
    const { aiWeight, teacherWeight } = await c.req.json();

    if (aiWeight === undefined || teacherWeight === undefined) {
      return c.json({
        success: false,
        error: 'กรุณาระบุ aiWeight และ teacherWeight',
      }, 400);
    }

    const settings = await updateMLTrainingSettings(
      schoolId || null,
      { aiWeight, teacherWeight },
      user
    );

    return c.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('[ML TRAINING] Error updating settings:', error);
    return c.json({
      success: false,
      error: error.message || 'ไม่สามารถอัพเดตการตั้งค่าได้',
    }, 400);
  }
};

/**
 * Train ML model
 * POST /api/ml-training/train?schoolId=xxx
 */
export const train = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || undefined;

    const result = await trainMLModel(schoolId || null, user);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error || 'การเทรนโมเดลล้มเหลว',
      }, 400);
    }

    return c.json({
      success: true,
      data: {
        accuracy: result.accuracy,
        mse: result.mse,
        mae: result.mae,
        samples: result.samples,
      },
    });
  } catch (error: any) {
    console.error('[ML TRAINING] Error training model:', error);
    return c.json({
      success: false,
      error: error.message || 'ไม่สามารถเทรนโมเดลได้',
    }, 400);
  }
};

/**
 * Get ML training history
 * GET /api/ml-training/history?schoolId=xxx&limit=20
 */
export const getHistory = async (c: Context) => {
  try {
    const user = c.get('user');
    const schoolId = c.req.query('schoolId') || undefined;
    const limit = parseInt(c.req.query('limit') || '20');

    const history = await getMLTrainingHistory(schoolId || null, user, limit);

    return c.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('[ML TRAINING] Error getting history:', error);
    return c.json({
      success: false,
      error: error.message || 'ไม่สามารถดึงประวัติได้',
    }, 400);
  }
};
