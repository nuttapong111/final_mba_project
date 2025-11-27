import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const addStudentToCourse = async (
  courseId: string,
  studentId: string,
  user: AuthUser
) => {
  // Check permission
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...(user.role === 'SCHOOL_ADMIN' && user.schoolId
        ? { schoolId: user.schoolId }
        : {}),
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตรหรือไม่มีสิทธิ์');
  }

  // Check if student exists
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: 'STUDENT',
      ...(user.role === 'SCHOOL_ADMIN' && user.schoolId
        ? { schoolId: user.schoolId }
        : {}),
    },
  });

  if (!student) {
    throw new Error('ไม่พบนักเรียนหรือไม่มีสิทธิ์');
  }

  // Add student to course
  const courseStudent = await prisma.courseStudent.upsert({
    where: {
      courseId_studentId: {
        courseId,
        studentId,
      },
    },
    update: {},
    create: {
      courseId,
      studentId,
      progress: 0,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return {
    id: courseStudent.student.id,
    name: courseStudent.student.name,
    email: courseStudent.student.email,
    avatar: courseStudent.student.avatar,
    enrolledAt: courseStudent.enrolledAt.toISOString(),
    progress: courseStudent.progress,
  };
};

export const removeStudentFromCourse = async (
  courseId: string,
  studentId: string,
  user: AuthUser
) => {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...(user.role === 'SCHOOL_ADMIN' && user.schoolId
        ? { schoolId: user.schoolId }
        : {}),
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตรหรือไม่มีสิทธิ์');
  }

  await prisma.courseStudent.delete({
    where: {
      courseId_studentId: {
        courseId,
        studentId,
      },
    },
  });

  return { success: true };
};


