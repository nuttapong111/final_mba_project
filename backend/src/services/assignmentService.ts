import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export interface CreateAssignmentData {
  courseId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  dueDate?: string;
  maxScore?: number;
  order?: number;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  dueDate?: string;
  maxScore?: number;
  order?: number;
}

export const getAssignmentsByCourse = async (courseId: string, user: AuthUser) => {
  // Check if user has access to course
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      students: {
        where: { studentId: user.id },
      },
      teachers: {
        where: { teacherId: user.id },
      },
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  const isStudent = course.students.length > 0;
  const isTeacher = course.teachers.length > 0 || course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);

  if (!isStudent && !isTeacher && !isAdmin) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้');
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: {
      submissions: {
        where: user.role === 'STUDENT' ? { studentId: user.id } : undefined,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  // Generate presigned URLs for S3 files
  const assignmentsWithUrls = await Promise.all(
    assignments.map(async (assignment) => {
      let fileUrl = assignment.fileUrl;
      
      // If assignment has S3 key, generate presigned URL
      if (assignment.s3Key) {
        try {
          const { getPresignedUrl } = await import('./s3Service');
          fileUrl = await getPresignedUrl(assignment.s3Key, 3600); // 1 hour expiry
          console.log(`[ASSIGNMENT] Generated presigned URL for assignment ${assignment.id}: ${fileUrl.substring(0, 50)}...`);
        } catch (error) {
          console.error(`[ASSIGNMENT] Failed to generate presigned URL for ${assignment.s3Key}:`, error);
          // Fallback to original fileUrl or try to construct URL from s3Key
          if (!fileUrl && assignment.s3Key) {
            // Try to use file API endpoint as fallback
            const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
            fileUrl = `${apiBaseUrl}/api/files/s3/${assignment.s3Key}`;
          }
        }
      } else if (!fileUrl && assignment.fileName) {
        // If no s3Key and no fileUrl, try to find file in S3 by fileName
        try {
          const { findFileInS3, getPresignedUrl } = await import('./s3Service');
          const foundS3Key = await findFileInS3(assignment.fileName);
          if (foundS3Key) {
            fileUrl = await getPresignedUrl(foundS3Key, 3600);
            console.log(`[ASSIGNMENT] Found file in S3 by fileName for assignment ${assignment.id}`);
          }
        } catch (error) {
          console.error(`[ASSIGNMENT] Failed to find file in S3 by fileName:`, error);
        }
      }

      // Generate presigned URLs for submission files
      const submissionsWithUrls = await Promise.all(
        (assignment.submissions || []).map(async (submission) => {
          let submissionFileUrl = submission.fileUrl;
          
          if (submission.s3Key) {
            try {
              const { getPresignedUrl } = await import('./s3Service');
              submissionFileUrl = await getPresignedUrl(submission.s3Key, 3600);
            } catch (error) {
              console.error(`[ASSIGNMENT] Failed to generate presigned URL for submission ${submission.s3Key}:`, error);
            }
          }

          return {
            ...submission,
            fileUrl: submissionFileUrl,
          };
        })
      );

      return {
        ...assignment,
        fileUrl,
        submissions: submissionsWithUrls,
      };
    })
  );

  return assignmentsWithUrls;
};

export const getAssignmentById = async (assignmentId: string, user: AuthUser) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        include: {
          students: {
            where: { studentId: user.id },
          },
          teachers: {
            where: { teacherId: user.id },
          },
        },
      },
      submissions: user.role === 'STUDENT'
        ? {
            where: { studentId: user.id },
          }
        : {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
    },
  });

  if (!assignment) {
    throw new Error('ไม่พบการบ้าน');
  }

  // Check permission
  const course = assignment.course;
  const isStudent = course.students.length > 0;
  const isTeacher = course.teachers.length > 0 || course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);

  if (!isStudent && !isTeacher && !isAdmin) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงการบ้านนี้');
  }

  return assignment;
};

export const createAssignment = async (data: CreateAssignmentData, user: AuthUser) => {
  // Verify course exists and user has permission
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission (only admin and teachers can create assignments)
  const isTeacher = course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: data.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์สร้างการบ้าน');
  }

  // Get max order
  const maxOrder = await prisma.assignment.findFirst({
    where: { courseId: data.courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description || null,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
      s3Key: data.s3Key || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      maxScore: data.maxScore || 100,
      order: data.order || (maxOrder ? maxOrder.order + 1 : 0),
      createdBy: user.id,
    },
  });

  return assignment;
};

export const updateAssignment = async (assignmentId: string, data: UpdateAssignmentData, user: AuthUser) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true,
    },
  });

  if (!assignment) {
    throw new Error('ไม่พบการบ้าน');
  }

  // Check permission
  const isTeacher = assignment.course.instructorId === user.id || assignment.createdBy === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && assignment.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: assignment.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์แก้ไขการบ้าน');
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      s3Key: data.s3Key,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      maxScore: data.maxScore,
      order: data.order,
    },
  });

  return updated;
};

export const deleteAssignment = async (assignmentId: string, user: AuthUser) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true,
    },
  });

  if (!assignment) {
    throw new Error('ไม่พบการบ้าน');
  }

  // Check permission
  const isTeacher = assignment.course.instructorId === user.id || assignment.createdBy === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && assignment.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: assignment.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ลบการบ้าน');
  }

  // Delete S3 files if exists
  if (assignment.s3Key) {
    try {
      const { deleteFileFromS3 } = await import('./s3Service');
      await deleteFileFromS3(assignment.s3Key);
    } catch (error) {
      console.error('Error deleting S3 file:', error);
      // Continue with deletion even if S3 delete fails
    }
  }

  // Delete submissions' S3 files
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: { s3Key: true },
  });

  for (const submission of submissions) {
    if (submission.s3Key) {
      try {
        const { deleteFileFromS3 } = await import('./s3Service');
        await deleteFileFromS3(submission.s3Key);
      } catch (error) {
        console.error('Error deleting submission S3 file:', error);
      }
    }
  }

  await prisma.assignment.delete({
    where: { id: assignmentId },
  });

  return { success: true };
};

export const submitAssignment = async (
  assignmentId: string,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  s3Key: string | undefined,
  user: AuthUser
) => {
  if (user.role !== 'STUDENT') {
    throw new Error('เฉพาะนักเรียนเท่านั้นที่สามารถส่งการบ้านได้');
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        include: {
          students: {
            where: { studentId: user.id },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('ไม่พบการบ้าน');
  }

  if (assignment.course.students.length === 0) {
    throw new Error('คุณไม่ได้ลงทะเบียนในหลักสูตรนี้');
  }

  // Check if due date has passed
  if (assignment.dueDate && new Date() > assignment.dueDate) {
    throw new Error('หมดเวลาส่งการบ้านแล้ว');
  }

  // Check if already submitted
  const existingSubmission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: user.id,
      },
    },
  });

  if (existingSubmission) {
    // Delete old file if exists
    if (existingSubmission.s3Key) {
      try {
        const { deleteFileFromS3 } = await import('./s3Service');
        await deleteFileFromS3(existingSubmission.s3Key);
      } catch (error) {
        console.error('Error deleting old submission S3 file:', error);
      }
    }

    // Update existing submission
    const updated = await prisma.assignmentSubmission.update({
      where: { id: existingSubmission.id },
      data: {
        fileUrl,
        fileName,
        fileSize,
        s3Key: s3Key || null,
        submittedAt: new Date(),
      },
    });

    return updated;
  } else {
    // Create new submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: user.id,
        fileUrl,
        fileName,
        fileSize,
        s3Key: s3Key || null,
        submittedAt: new Date(),
      },
    });

    return submission;
  }
};

export const gradeAssignment = async (
  submissionId: string,
  score: number,
  feedback: string | undefined,
  user: AuthUser
) => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: {
          course: true,
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
  });

  return updated;
};

