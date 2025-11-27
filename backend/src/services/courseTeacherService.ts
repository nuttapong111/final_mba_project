import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const addTeacherToCourse = async (
  courseId: string,
  teacherId: string,
  roles: { liveTeaching: boolean; grading: boolean; webboard: boolean },
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

  // Check if teacher exists and is a teacher
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: 'TEACHER',
      ...(user.role === 'SCHOOL_ADMIN' && user.schoolId
        ? { schoolId: user.schoolId }
        : {}),
    },
  });

  if (!teacher) {
    throw new Error('ไม่พบอาจารย์หรือไม่มีสิทธิ์');
  }

  // Add teacher to course
  const courseTeacher = await prisma.courseTeacher.upsert({
    where: {
      courseId_teacherId: {
        courseId,
        teacherId,
      },
    },
    update: {
      liveTeaching: roles.liveTeaching,
      grading: roles.grading,
      webboard: roles.webboard,
    },
    create: {
      courseId,
      teacherId,
      liveTeaching: roles.liveTeaching,
      grading: roles.grading,
      webboard: roles.webboard,
    },
    include: {
      teacher: {
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
    id: courseTeacher.teacher.id,
    name: courseTeacher.teacher.name,
    email: courseTeacher.teacher.email,
    avatar: courseTeacher.teacher.avatar,
    roles: {
      liveTeaching: courseTeacher.liveTeaching,
      grading: courseTeacher.grading,
      webboard: courseTeacher.webboard,
    },
    addedAt: courseTeacher.addedAt.toISOString(),
  };
};

export const removeTeacherFromCourse = async (
  courseId: string,
  teacherId: string,
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

  await prisma.courseTeacher.delete({
    where: {
      courseId_teacherId: {
        courseId,
        teacherId,
      },
    },
  });

  return { success: true };
};

export const updateTeacherRoles = async (
  courseId: string,
  teacherId: string,
  roles: { liveTeaching: boolean; grading: boolean; webboard: boolean },
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

  const courseTeacher = await prisma.courseTeacher.update({
    where: {
      courseId_teacherId: {
        courseId,
        teacherId,
      },
    },
    data: {
      liveTeaching: roles.liveTeaching,
      grading: roles.grading,
      webboard: roles.webboard,
    },
    include: {
      teacher: {
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
    id: courseTeacher.teacher.id,
    name: courseTeacher.teacher.name,
    email: courseTeacher.teacher.email,
    avatar: courseTeacher.teacher.avatar,
    roles: {
      liveTeaching: courseTeacher.liveTeaching,
      grading: courseTeacher.grading,
      webboard: courseTeacher.webboard,
    },
    addedAt: courseTeacher.addedAt.toISOString(),
  };
};


