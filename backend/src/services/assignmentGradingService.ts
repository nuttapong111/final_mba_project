import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { getAIGradingSuggestion } from './aiService';

export interface AssignmentGradingTask {
  id: string;
  courseId: string;
  courseTitle: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  maxScore: number;
  status: 'pending' | 'graded';
  aiScore?: number;
  aiFeedback?: string;
}

/**
 * Get all assignment submissions that need grading for the logged-in teacher
 */
export const getAssignmentGradingTasks = async (user: AuthUser): Promise<AssignmentGradingTask[]> => {
  // Get all courses where user is instructor or teacher with grading permission
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: user.id },
        {
          teachers: {
            some: {
              teacherId: user.id,
              grading: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
    },
  });

  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return [];
  }

  // Get all assignment submissions from these courses
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignment: {
        courseId: { in: courseIds },
      },
      submittedAt: { not: null },
    },
    include: {
      assignment: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              schoolId: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  // Generate presigned URLs for S3 files
  const tasksWithUrls = await Promise.all(
    submissions.map(async (submission) => {
      let fileUrl = submission.fileUrl;

      if (submission.s3Key) {
        try {
          const { getPresignedUrl } = await import('./s3Service');
          fileUrl = await getPresignedUrl(submission.s3Key, 3600);
        } catch (error) {
          console.error(`[ASSIGNMENT GRADING] Failed to generate presigned URL for ${submission.s3Key}:`, error);
        }
      }

      // Try to generate AI feedback automatically if not graded yet
      let aiScore: number | undefined = undefined;
      let aiFeedback: string | undefined = undefined;

      if (!submission.score && submission.submittedAt) {
        try {
          const schoolId = submission.assignment.course.schoolId;
          const assignmentTitle = submission.assignment.title;
          const assignmentDescription = submission.assignment.description || '';
          const studentNotes = `นักเรียนส่งไฟล์: ${submission.fileName || 'ไฟล์การบ้าน'}`;
          
          const aiResult = await getAIGradingSuggestion(
            `การบ้าน: ${assignmentTitle}${assignmentDescription ? `\nคำอธิบาย: ${assignmentDescription}` : ''}`,
            studentNotes,
            submission.assignment.maxScore,
            schoolId
          );
          
          aiScore = aiResult.score;
          aiFeedback = aiResult.feedback;
        } catch (error) {
          console.error('[ASSIGNMENT GRADING] Error generating AI feedback:', error);
          // Continue without AI feedback
        }
      }

      return {
        id: submission.id,
        courseId: submission.assignment.courseId,
        courseTitle: submission.assignment.course.title,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment.title,
        studentId: submission.studentId,
        studentName: submission.student.name,
        studentAvatar: submission.student.avatar || undefined,
        submittedAt: submission.submittedAt?.toISOString() || submission.createdAt.toISOString(),
        fileUrl: fileUrl || undefined,
        fileName: submission.fileName || undefined,
        fileSize: submission.fileSize || undefined,
        score: submission.score || undefined,
        feedback: submission.feedback || undefined,
        gradedAt: submission.gradedAt?.toISOString() || undefined,
        maxScore: submission.assignment.maxScore,
        status: submission.score !== null ? ('graded' as const) : ('pending' as const),
        aiScore,
        aiFeedback,
      };
    })
  );

  return tasksWithUrls;
};

/**
 * Grade an assignment submission
 */
export const gradeAssignmentSubmission = async (
  submissionId: string,
  score: number,
  feedback: string | undefined,
  user: AuthUser
): Promise<AssignmentGradingTask> => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          course: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error('ไม่พบการส่งงาน');
  }

  // Check permission (only teachers and admins can grade)
  const isTeacher = submission.assignment.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && submission.assignment.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: submission.assignment.courseId,
      teacherId: user.id,
      grading: true,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ให้คะแนน');
  }

  // Validate score
  if (score < 0 || score > submission.assignment.maxScore) {
    throw new Error(`คะแนนต้องอยู่ระหว่าง 0 ถึง ${submission.assignment.maxScore}`);
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback: feedback || null,
      gradedAt: new Date(),
      gradedBy: user.id,
    },
    include: {
      assignment: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // Generate presigned URL if needed
  let fileUrl = updated.fileUrl;
  if (updated.s3Key) {
    try {
      const { getPresignedUrl } = await import('./s3Service');
      fileUrl = await getPresignedUrl(updated.s3Key, 3600);
    } catch (error) {
      console.error(`[ASSIGNMENT GRADING] Failed to generate presigned URL:`, error);
    }
  }

  return {
    id: updated.id,
    courseId: updated.assignment.courseId,
    courseTitle: updated.assignment.course.title,
    assignmentId: updated.assignmentId,
    assignmentTitle: updated.assignment.title,
    studentId: updated.studentId,
    studentName: updated.student.name,
    studentAvatar: updated.student.avatar || undefined,
    submittedAt: updated.submittedAt?.toISOString() || updated.createdAt.toISOString(),
    fileUrl: fileUrl || undefined,
    fileName: updated.fileName || undefined,
    fileSize: updated.fileSize || undefined,
    score: updated.score || undefined,
    feedback: updated.feedback || undefined,
    gradedAt: updated.gradedAt?.toISOString() || undefined,
    maxScore: updated.assignment.maxScore,
    status: updated.score !== null ? ('graded' as const) : ('pending' as const),
  };
};

