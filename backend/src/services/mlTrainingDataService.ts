import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Save grading data to MLTrainingData table for ML training
 */
export const saveMLTrainingData = async (
  question: string,
  answer: string,
  aiScore: number | null,
  aiFeedback: string | null,
  teacherScore: number | null,
  teacherFeedback: string | null,
  maxScore: number,
  sourceType: 'exam' | 'assignment',
  sourceId: string,
  schoolId?: string | null
): Promise<void> => {
  try {
    // Check if record already exists
    const existing = await prisma.mLTrainingData.findFirst({
      where: {
        sourceType,
        sourceId,
      },
    });

    if (existing) {
      // Update existing record - merge AI and teacher feedback
      await prisma.mLTrainingData.update({
        where: { id: existing.id },
        data: {
          question,
          answer,
          aiScore: aiScore ?? existing.aiScore,
          aiFeedback: aiFeedback ?? existing.aiFeedback,
          teacherScore: teacherScore ?? existing.teacherScore,
          teacherFeedback: teacherFeedback ?? existing.teacherFeedback,
          maxScore,
          schoolId: schoolId ?? existing.schoolId,
        },
      });
      console.log(`[ML TRAINING DATA] Updated training data for ${sourceType}:${sourceId}`);
    } else {
      // Create new record
      await prisma.mLTrainingData.create({
        data: {
          question,
          answer,
          aiScore,
          aiFeedback,
          teacherScore,
          teacherFeedback,
          maxScore,
          sourceType,
          sourceId,
          schoolId: schoolId || null,
          usedForTraining: false,
        },
      });
      console.log(`[ML TRAINING DATA] Created training data for ${sourceType}:${sourceId}`);
    }
  } catch (error: any) {
    console.error('[ML TRAINING DATA] Error saving training data:', error);
    // Don't throw error - this is not critical for the main flow
  }
};

/**
 * Get training data for ML model
 */
export const getMLTrainingData = async (
  limit: number = 1000,
  schoolId?: string | null
): Promise<Array<{
  question: string;
  answer: string;
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number;
  teacherFeedback: string | null;
  maxScore: number;
}>> => {
  try {
    const where = schoolId ? { schoolId } : {};
    
    const data = await prisma.mLTrainingData.findMany({
      where: {
        ...where,
        teacherScore: { not: null },
        teacherFeedback: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return data.map((item) => ({
      question: item.question,
      answer: item.answer,
      aiScore: item.aiScore,
      aiFeedback: item.aiFeedback,
      teacherScore: item.teacherScore!,
      teacherFeedback: item.teacherFeedback,
      maxScore: item.maxScore,
    }));
  } catch (error: any) {
    console.error('[ML TRAINING DATA] Error fetching training data:', error);
    throw error;
  }
};

/**
 * Mark training data as used for training
 */
export const markTrainingDataAsUsed = async (ids: string[]): Promise<void> => {
  try {
    await prisma.mLTrainingData.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        usedForTraining: true,
      },
    });
    console.log(`[ML TRAINING DATA] Marked ${ids.length} records as used for training`);
  } catch (error: any) {
    console.error('[ML TRAINING DATA] Error marking training data as used:', error);
    throw error;
  }
};

