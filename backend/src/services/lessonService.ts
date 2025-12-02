import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { deleteFileFromS3 } from './s3Service';
import { isS3Configured } from './uploadService';

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
  s3Key?: string; // S3 key สำหรับลบไฟล์จาก S3
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
  assignmentId?: string;
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
    // ก่อนลบ lessons ให้ลบไฟล์จาก S3 ก่อน
    const existingLessons = await tx.lesson.findMany({
      where: { courseId },
      include: {
        contents: {
          select: {
            id: true,
            s3Key: true,
            fileName: true,
          },
        },
      },
    });

    // ลบไฟล์จาก S3 สำหรับไฟล์ที่มี s3Key
    if (isS3Configured()) {
      for (const lesson of existingLessons) {
        for (const content of lesson.contents) {
          if (content.s3Key) {
            try {
              console.log(`[DELETE] ลบไฟล์จาก S3: ${content.s3Key}`);
              await deleteFileFromS3(content.s3Key);
              console.log(`[DELETE] ✅ ลบไฟล์จาก S3 สำเร็จ: ${content.s3Key}`);
            } catch (error: any) {
              // Log error แต่ไม่ throw เพื่อให้ลบ database ได้ต่อ
              console.error(`[DELETE] ⚠️ ไม่สามารถลบไฟล์จาก S3: ${content.s3Key}`, error.message);
            }
          }
        }
      }
    }

    // Delete existing lessons and contents (cascade will handle contents)
    await tx.lesson.deleteMany({
      where: { courseId },
    });

    // Create new lessons with contents
    for (const lessonData of lessons) {
      // Process contents and check for poll existence before creating
      const contentsToCreate = await Promise.all(
        lessonData.contents.map(async (contentData, contentIndex) => {
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
            pollId: contentData.pollId,
          });
          
          // Check if poll exists before connecting
          let pollConnection = undefined;
          if (contentData.pollId) {
            const pollExists = await tx.poll.findUnique({
              where: { id: contentData.pollId },
            });
            if (pollExists) {
              pollConnection = { connect: { id: contentData.pollId } };
              console.log(`[DEBUG] Poll ${contentData.pollId} found, will connect`);
            } else {
              console.warn(`[WARN] Poll ${contentData.pollId} not found, skipping connection for content: ${contentData.title}`);
            }
          }

          // Check if assignment exists before connecting
          let assignmentConnection = undefined;
          if (contentData.assignmentId) {
            const assignmentExists = await tx.assignment.findUnique({
              where: { id: contentData.assignmentId },
            });
            if (assignmentExists) {
              assignmentConnection = contentData.assignmentId;
              console.log(`[DEBUG] Assignment ${contentData.assignmentId} found, will connect`);
            } else {
              console.warn(`[WARN] Assignment ${contentData.assignmentId} not found, skipping connection for content: ${contentData.title}`);
            }
          }
          
          const contentToSave = {
            type: contentData.type.toUpperCase() as any,
            title: contentData.title,
            url: contentData.url || null,
            fileUrl: contentData.fileUrl || null,
            fileName: contentData.fileName || null,
            fileSize: contentData.fileSize || null,
            s3Key: contentData.s3Key || null, // เก็บ S3 key สำหรับลบไฟล์
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
            assignmentId: assignmentConnection || null,
          };
          
          console.log(`[DEBUG] Content to save (final):`, {
            title: contentToSave.title,
            fileUrl: contentToSave.fileUrl,
            fileName: contentToSave.fileName,
            fileSize: contentToSave.fileSize,
            hasPoll: !!pollConnection,
          });
          
          return contentToSave;
        })
      );

      const lesson = await tx.lesson.create({
        data: {
          courseId,
          title: lessonData.title,
          description: lessonData.description || null,
          order: lessonData.order,
          contents: {
            create: contentsToCreate,
          },
        },
      });
    }
  });

  return { success: true };
};

