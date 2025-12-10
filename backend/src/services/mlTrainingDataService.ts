import prisma from '../config/database';

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

/**
 * Sync existing grading data to MLTrainingData table
 * This function migrates existing data that has AI feedback but hasn't been saved to MLTrainingData yet
 */
export const syncExistingGradingData = async (schoolId?: string | null): Promise<{
  examTasksSynced: number;
  assignmentSubmissionsSynced: number;
}> => {
  let examTasksSynced = 0;
  let assignmentSubmissionsSynced = 0;

  try {
    // Sync exam grading tasks
    const examTasks = await prisma.gradingTask.findMany({
      where: {
        aiScore: { not: null },
        aiFeedback: { not: null },
        submission: {
          exam: {
            course: {
              schoolId: schoolId || undefined,
            },
          },
        },
      },
      include: {
        submission: {
          include: {
            exam: {
              include: {
                course: {
                  select: {
                    schoolId: true,
                  },
                },
                examQuestions: {
                  include: {
                    question: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const task of examTasks) {
      const question = task.submission.exam.examQuestions.find(
        (eq) => eq.questionId === task.questionId
      )?.question;

      if (question) {
        // Check if already exists
        const existing = await prisma.mLTrainingData.findFirst({
          where: {
            sourceType: 'exam',
            sourceId: task.id,
          },
        });

        if (!existing) {
          await saveMLTrainingData(
            question.question,
            task.answer,
            task.aiScore,
            task.aiFeedback,
            task.teacherScore,
            task.teacherFeedback,
            question.points,
            'exam',
            task.id,
            task.submission.exam.course.schoolId
          );
          examTasksSynced++;
        }
      }
    }

    // Sync assignment submissions
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        aiScore: { not: null },
        aiFeedback: { not: null },
        assignment: {
          course: {
            schoolId: schoolId || undefined,
          },
        },
      },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                schoolId: true,
              },
            },
          },
        },
      },
    });

    for (const submission of assignmentSubmissions) {
      // Check if already exists
      const existing = await prisma.mLTrainingData.findFirst({
        where: {
          sourceType: 'assignment',
          sourceId: submission.id,
        },
      });

      if (!existing) {
        // Build assignment context as question
        let assignmentContext = `การบ้าน: ${submission.assignment.title}`;
        if (submission.assignment.description) {
          assignmentContext += `\nคำอธิบาย: ${submission.assignment.description}`;
        }

        // Get student answer
        let studentAnswer = 'นักเรียนส่งไฟล์';
        if (submission.fileName) {
          studentAnswer = `นักเรียนส่งไฟล์: ${submission.fileName}`;
        }

        await saveMLTrainingData(
          assignmentContext,
          studentAnswer,
          submission.aiScore,
          submission.aiFeedback,
          submission.score,
          submission.feedback,
          submission.assignment.maxScore,
          'assignment',
          submission.id,
          submission.assignment.course.schoolId
        );
        assignmentSubmissionsSynced++;
      }
    }

    console.log(`[ML TRAINING DATA] Synced ${examTasksSynced} exam tasks and ${assignmentSubmissionsSynced} assignment submissions`);
    return {
      examTasksSynced,
      assignmentSubmissionsSynced,
    };
  } catch (error: any) {
    console.error('[ML TRAINING DATA] Error syncing existing grading data:', error);
    throw error;
  }
};

