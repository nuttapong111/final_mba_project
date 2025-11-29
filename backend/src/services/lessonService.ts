import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export interface LessonData {
  id?: string;
  title: string;
  description?: string;
  order: number;
  contents: ContentData[];
}

export interface ContentData {
  id?: string;
  type: string;
  title: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  order: number;
  quizSettings?: {
    totalQuestions?: number;
    duration?: number;
    maxAttempts?: number;
    timeRestriction?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    passingPercentage?: number;
    categorySelections?: Array<{
      categoryId: string;
      categoryName: string;
      questionCount: number;
      difficulty?: string;
    }>;
  };
  pollId?: string;
}

export const saveCourseContent = async (
  courseId: string,
  lessons: LessonData[],
  user: AuthUser
) => {
  // Verify course exists and user has permission
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์แก้ไขหลักสูตรนี้');
  }

  // Use transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // Delete existing lessons and contents (cascade will handle contents)
    await tx.lesson.deleteMany({
      where: { courseId },
    });

    // Create new lessons with contents
    for (const lessonData of lessons) {
      const lesson = await tx.lesson.create({
        data: {
          courseId,
          title: lessonData.title,
          description: lessonData.description || null,
          order: lessonData.order,
          contents: {
            create: lessonData.contents.map((contentData, contentIndex) => {
              // Debug logging - always log to see what we're saving
              console.log(`[DEBUG] Saving content ${contentIndex}:`, {
                title: contentData.title,
                type: contentData.type,
                url: contentData.url,
                fileUrl: contentData.fileUrl,
                fileName: contentData.fileName,
                fileSize: contentData.fileSize,
                hasFileUrl: !!contentData.fileUrl,
                hasFileName: !!contentData.fileName,
                hasFileSize: !!contentData.fileSize,
              });
              
              const contentToSave = {
                type: contentData.type.toUpperCase() as any,
                title: contentData.title,
                url: contentData.url || null,
                fileUrl: contentData.fileUrl || null,
                fileName: contentData.fileName || null,
                fileSize: contentData.fileSize || null,
                duration: contentData.duration || null,
                order: contentData.order,
              quizSettings: contentData.quizSettings
                ? {
                    create: {
                      totalQuestions: contentData.quizSettings.totalQuestions || null,
                      duration: contentData.quizSettings.duration || null,
                      maxAttempts: contentData.quizSettings.maxAttempts || 0,
                      timeRestriction: contentData.quizSettings.timeRestriction || null,
                      startDate: contentData.quizSettings.startDate
                        ? new Date(contentData.quizSettings.startDate)
                        : null,
                      startTime: contentData.quizSettings.startTime || null,
                      endDate: contentData.quizSettings.endDate
                        ? new Date(contentData.quizSettings.endDate)
                        : null,
                      endTime: contentData.quizSettings.endTime || null,
                      passingPercentage:
                        contentData.quizSettings.passingPercentage || 70,
                      categorySelections: {
                        create:
                          contentData.quizSettings.categorySelections?.map(
                            (selection) => ({
                              categoryId: selection.categoryId,
                              categoryName: selection.categoryName,
                              questionCount: selection.questionCount,
                              difficulty: selection.difficulty
                                ? (selection.difficulty.toUpperCase() as any)
                                : null,
                            })
                          ) || [],
                      },
                    },
                  }
                : undefined,
              poll: pollConnection,
              };
              
              console.log(`[DEBUG] Content to save (final):`, {
                title: contentToSave.title,
                fileUrl: contentToSave.fileUrl,
                fileName: contentToSave.fileName,
                fileSize: contentToSave.fileSize,
              });
              
              return contentToSave;
            }),
          },
        },
      });
    }
  });

  return { success: true };
};

