import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getLiveSessions = async (user: AuthUser) => {
  let where: any = {};

  if (user.role === 'TEACHER') {
    // Get sessions from courses where user is instructor or teacher
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: user.id },
          { teachers: { some: { teacherId: user.id } } },
        ],
      },
      select: { id: true },
    });

    where.courseId = { in: courses.map((c) => c.id) };
  } else if (user.role === 'STUDENT') {
    // Get sessions from enrolled courses
    const enrollments = await prisma.courseStudent.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });

    where.courseId = { in: enrollments.map((e) => e.courseId) };
  } else if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    // Get sessions from school courses
    const courses = await prisma.course.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true },
    });

    where.courseId = { in: courses.map((c) => c.id) };
  }

  const sessions = await prisma.liveSession.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  return sessions.map((session) => ({
    ...session,
    enrolledStudents: session._count.attendances,
  }));
};


