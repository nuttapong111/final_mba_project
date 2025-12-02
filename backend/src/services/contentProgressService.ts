import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export interface VideoProgressData {
  contentId: string;
  courseId: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  completed?: boolean;
}

/**
 * Get content progress for a student
 */
export const getContentProgress = async (
  contentId: string,
  studentId: string
) => {
  const progress = await prisma.contentProgress.findUnique({
    where: {
      contentId_studentId: {
        contentId,
        studentId,
      },
    },
  });

  return progress;
};

/**
 * Update video progress
 */
export const updateVideoProgress = async (
  data: VideoProgressData,
  studentId: string
) => {
  const { contentId, courseId, currentTime, duration, completed } = data;

  // Calculate progress percentage
  const progressPercentage = duration > 0 
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

  // Mark as completed if watched more than 80% or explicitly marked
  const isCompleted = completed || progressPercentage >= 80;

  const progress = await prisma.contentProgress.upsert({
    where: {
      contentId_studentId: {
        contentId,
        studentId,
      },
    },
    create: {
      contentId,
      studentId,
      courseId,
      progress: progressPercentage,
      lastPosition: Math.floor(currentTime),
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      progress: progressPercentage,
      lastPosition: Math.floor(currentTime),
      completed: isCompleted,
      completedAt: isCompleted && !completed ? new Date() : undefined,
    },
  });

  // Update course progress
  await updateCourseProgress(courseId, studentId);

  return progress;
};

/**
 * Mark content as completed
 */
export const markContentCompleted = async (
  contentId: string,
  courseId: string,
  studentId: string
) => {
  const progress = await prisma.contentProgress.upsert({
    where: {
      contentId_studentId: {
        contentId,
        studentId,
      },
    },
    create: {
      contentId,
      studentId,
      courseId,
      completed: true,
      progress: 100,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      progress: 100,
      completedAt: new Date(),
    },
  });

  // Update course progress
  await updateCourseProgress(courseId, studentId);

  return progress;
};

/**
 * Calculate and update course progress
 */
const updateCourseProgress = async (courseId: string, studentId: string) => {
  // Get all contents in the course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        include: {
          contents: true,
        },
      },
    },
  });

  if (!course) return;

  // Get all content IDs
  const allContentIds = course.lessons.flatMap(lesson =>
    lesson.contents.map(content => content.id)
  );

  if (allContentIds.length === 0) return;

  // Get all progress records for this student
  const progressRecords = await prisma.contentProgress.findMany({
    where: {
      contentId: { in: allContentIds },
      studentId,
    },
  });

  // Calculate average progress - only count completed contents
  const completedCount = progressRecords.filter(r => r.completed).length;
  const totalProgress = progressRecords.reduce((sum, record) => {
    return sum + record.progress;
  }, 0);

  // Calculate progress: average of all contents (completed = 100%, incomplete = progress%)
  const averageProgress = allContentIds.length > 0
    ? Math.round((totalProgress / allContentIds.length) * 100) / 100
    : 0;

  // Update course student progress
  await prisma.courseStudent.updateMany({
    where: {
      courseId,
      studentId,
    },
    data: {
      progress: averageProgress,
      completedAt: averageProgress >= 100 ? new Date() : null,
    },
  });
};

/**
 * Get all progress for a course
 */
export const getCourseProgress = async (
  courseId: string,
  studentId: string
) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lessons: {
        include: {
          contents: {
            include: {
              contentProgress: {
                where: {
                  studentId,
                },
              },
            },
          },
        },
      },
    },
  });

  return course;
};


