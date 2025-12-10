import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { getMLApiUrl } from './aiSettingsService';

export interface MLTrainingStats {
  totalSamples: number;
  samplesWithAI: number;
  samplesWithTeacher: number;
  samplesUsedForTraining: number;
  lastTrainingDate: Date | null;
  lastTrainingAccuracy: number | null;
  lastTrainingMSE: number | null;
  lastTrainingMAE: number | null;
}

export interface MLTrainingSettings {
  aiWeight: number;
  teacherWeight: number;
}

export interface MLTrainingResult {
  success: boolean;
  accuracy?: number;
  mse?: number;
  mae?: number;
  samples?: number;
  error?: string;
}

/**
 * Get ML training statistics
 */
export const getMLTrainingStats = async (
  schoolId: string | null,
  user: AuthUser
): Promise<MLTrainingStats> => {
  // Check permission - only SUPER_ADMIN and SCHOOL_ADMIN can access
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงสถิติการเทรน ML');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  // Get total samples - include all records with AI feedback OR teacher feedback
  const totalSamples = await prisma.mLTrainingData.count({
    where: {
      schoolId: targetSchoolId || undefined,
      OR: [
        {
          aiScore: { not: null },
          aiFeedback: { not: null },
        },
        {
          teacherScore: { not: null },
          teacherFeedback: { not: null },
        },
      ],
    },
  });

  // Get samples with AI feedback (may or may not have teacher feedback)
  const samplesWithAI = await prisma.mLTrainingData.count({
    where: {
      schoolId: targetSchoolId || undefined,
      aiScore: { not: null },
      aiFeedback: { not: null },
    },
  });

  // Get samples with teacher feedback (must have both score and feedback)
  const samplesWithTeacher = await prisma.mLTrainingData.count({
    where: {
      schoolId: targetSchoolId || undefined,
      teacherScore: { not: null },
      teacherFeedback: { not: null },
    },
  });

  // Get samples used for training
  const samplesUsedForTraining = await prisma.mLTrainingData.count({
    where: {
      schoolId: targetSchoolId || undefined,
      usedForTraining: true,
    },
  });

  // Get last training history
  const lastTraining = await prisma.mLTrainingHistory.findFirst({
    where: {
      schoolId: targetSchoolId || undefined,
      status: 'completed',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    totalSamples,
    samplesWithAI,
    samplesWithTeacher,
    samplesUsedForTraining,
    lastTrainingDate: lastTraining?.createdAt || null,
    lastTrainingAccuracy: lastTraining?.accuracy || null,
    lastTrainingMSE: lastTraining?.mse || null,
    lastTrainingMAE: lastTraining?.mae || null,
  };
};

/**
 * Get ML training settings (weight configuration)
 */
export const getMLTrainingSettings = async (
  schoolId: string | null,
  user: AuthUser
): Promise<MLTrainingSettings> => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงการตั้งค่าการเทรน ML');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  // Use findUnique when schoolId is provided, otherwise use findFirst for null
  let settings = targetSchoolId
    ? await prisma.mLTrainingSettings.findUnique({
        where: { schoolId: targetSchoolId },
      })
    : await prisma.mLTrainingSettings.findFirst({
        where: { schoolId: null },
      });

  // If no settings exist, create default
  if (!settings) {
    settings = await prisma.mLTrainingSettings.create({
      data: {
        schoolId: targetSchoolId || null,
        aiWeight: 0.3,
        teacherWeight: 0.7,
      },
    });
  }

  return {
    aiWeight: settings.aiWeight,
    teacherWeight: settings.teacherWeight,
  };
};

/**
 * Update ML training settings
 */
export const updateMLTrainingSettings = async (
  schoolId: string | null,
  data: MLTrainingSettings,
  user: AuthUser
): Promise<MLTrainingSettings> => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์แก้ไขการตั้งค่าการเทรน ML');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  // Validate weights sum to 1.0
  const totalWeight = data.aiWeight + data.teacherWeight;
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error('ผลรวมของ weight ต้องเท่ากับ 1.0');
  }

  // Validate weights are between 0 and 1
  if (data.aiWeight < 0 || data.aiWeight > 1 || data.teacherWeight < 0 || data.teacherWeight > 1) {
    throw new Error('Weight ต้องอยู่ระหว่าง 0 ถึง 1');
  }

  // Use upsert when schoolId is provided, otherwise use findFirst + create/update
  let settings;
  if (targetSchoolId) {
    settings = await prisma.mLTrainingSettings.upsert({
      where: { schoolId: targetSchoolId },
      create: {
        schoolId: targetSchoolId,
        aiWeight: data.aiWeight,
        teacherWeight: data.teacherWeight,
      },
      update: {
        aiWeight: data.aiWeight,
        teacherWeight: data.teacherWeight,
      },
    });
  } else {
    // For null schoolId (global settings), use findFirst + create/update
    const existing = await prisma.mLTrainingSettings.findFirst({
      where: { schoolId: null },
    });

    if (existing) {
      settings = await prisma.mLTrainingSettings.update({
        where: { id: existing.id },
        data: {
          aiWeight: data.aiWeight,
          teacherWeight: data.teacherWeight,
        },
      });
    } else {
      settings = await prisma.mLTrainingSettings.create({
        data: {
          schoolId: null,
          aiWeight: data.aiWeight,
          teacherWeight: data.teacherWeight,
        },
      });
    }
  }

  return {
    aiWeight: settings.aiWeight,
    teacherWeight: settings.teacherWeight,
  };
};

/**
 * Train ML model
 */
export const trainMLModel = async (
  schoolId: string | null,
  user: AuthUser
): Promise<MLTrainingResult> => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เทรนโมเดล ML');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  try {
    // Get ML API URL
    const mlApiUrl = await getMLApiUrl(targetSchoolId || null);
    if (!mlApiUrl) {
      throw new Error('ไม่พบ ML API URL กรุณาตั้งค่าในหน้า Settings');
    }

    // Get training settings
    const settings = await getMLTrainingSettings(targetSchoolId || null, user);

    // Get training data with IDs for marking as used later
    const trainingDataWithIds = await prisma.mLTrainingData.findMany({
      where: {
        schoolId: targetSchoolId || undefined,
        OR: [
          {
            teacherScore: { not: null },
            teacherFeedback: { not: null },
          },
          {
            aiScore: { not: null },
            aiFeedback: { not: null },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000,
    });

    const MIN_SAMPLES = 5; // Minimum samples required for training (reduced for testing)
    if (trainingDataWithIds.length < MIN_SAMPLES) {
      throw new Error(`ข้อมูลไม่เพียงพอสำหรับเทรนโมเดล (พบ ${trainingDataWithIds.length} ตัวอย่าง ต้องการอย่างน้อย ${MIN_SAMPLES})`);
    }

    // Transform to format expected for training
    const trainingData = trainingDataWithIds.map((item) => ({
      question: item.question,
      answer: item.answer,
      aiScore: item.aiScore,
      aiFeedback: item.aiFeedback,
      teacherScore: item.teacherScore ?? item.aiScore ?? 0,
      teacherFeedback: item.teacherFeedback,
      maxScore: item.maxScore,
    }));

    // Prepare training data with weights
    // Apply weights to scores: weighted_score = aiWeight * aiScore + teacherWeight * teacherScore
    const weightedTrainingData = trainingData.map((item) => {
      let targetScore: number;

      // Determine target score based on available data
      if (item.aiScore !== null && item.teacherScore !== null && item.teacherScore !== item.aiScore) {
        // Both AI and teacher scores exist and are different - apply weights
        targetScore = settings.aiWeight * item.aiScore + settings.teacherWeight * item.teacherScore;
      } else if (item.teacherScore !== null && item.teacherScore !== 0) {
        // Only teacher score exists (or teacher score is different from AI score)
        targetScore = item.teacherScore;
      } else if (item.aiScore !== null) {
        // Only AI score exists - use it directly
        targetScore = item.aiScore;
      } else {
        // Fallback (should not happen due to query filter, but just in case)
        targetScore = 0;
      }

      return {
        question: item.question,
        answer: item.answer,
        aiScore: item.aiScore,
        aiFeedback: item.aiFeedback || '',
        teacherScore: targetScore,
        teacherFeedback: item.teacherFeedback || '',
      };
    });

    // Call ML service to train
    const response = await fetch(`${mlApiUrl}/api/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradingTasks: weightedTrainingData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as {
      success: boolean;
      accuracy?: number;
      mse?: number;
      mae?: number;
      samples?: number;
      error?: string;
    };

    if (!result.success) {
      throw new Error(result.error || 'การเทรนโมเดลล้มเหลว');
    }

    // Save training history
    await prisma.mLTrainingHistory.create({
      data: {
        schoolId: targetSchoolId || null,
        accuracy: result.accuracy ?? null,
        mse: result.mse ?? null,
        mae: result.mae ?? null,
        samples: result.samples ?? weightedTrainingData.length,
        aiWeight: settings.aiWeight,
        teacherWeight: settings.teacherWeight,
        status: 'completed',
      },
    });

    // Mark training data as used (mark the actual data that was used for training)
    if (trainingDataWithIds.length > 0) {
      await prisma.mLTrainingData.updateMany({
        where: {
          id: { in: trainingDataWithIds.map((d) => d.id) },
        },
        data: {
          usedForTraining: true,
        },
      });
    }

    return {
      success: true,
      accuracy: result.accuracy,
      mse: result.mse,
      mae: result.mae,
      samples: result.samples ?? weightedTrainingData.length,
    };
  } catch (error: any) {
    // Save failed training history
    const settings = await getMLTrainingSettings(targetSchoolId || null, user).catch(() => ({
      aiWeight: 0.3,
      teacherWeight: 0.7,
    }));

    await prisma.mLTrainingHistory.create({
      data: {
        schoolId: targetSchoolId || null,
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
        aiWeight: settings.aiWeight,
        teacherWeight: settings.teacherWeight,
        samples: 0,
      },
    });

    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการเทรนโมเดล',
    };
  }
};

/**
 * Get ML training history
 */
export const getMLTrainingHistory = async (
  schoolId: string | null,
  user: AuthUser,
  limit: number = 20
): Promise<Array<{
  id: string;
  accuracy: number | null;
  mse: number | null;
  mae: number | null;
  samples: number;
  aiWeight: number;
  teacherWeight: number;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}>> => {
  // Check permission
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงประวัติการเทรน ML');
  }

  const targetSchoolId = user.role === 'SUPER_ADMIN' ? schoolId : user.schoolId;

  const history = await prisma.mLTrainingHistory.findMany({
    where: {
      schoolId: targetSchoolId || undefined,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return history.map((h: any) => ({
    id: h.id,
    accuracy: h.accuracy,
    mse: h.mse,
    mae: h.mae,
    samples: h.samples,
    aiWeight: h.aiWeight,
    teacherWeight: h.teacherWeight,
    status: h.status,
    errorMessage: h.errorMessage,
    createdAt: h.createdAt,
  }));
};
