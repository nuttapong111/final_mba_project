import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getSchoolDashboardStats = async (user: AuthUser) => {
  if (user.role !== 'SCHOOL_ADMIN' || !user.schoolId) {
    throw new Error('Unauthorized');
  }

  // Get total students
  const totalStudents = await prisma.user.count({
    where: {
      role: 'STUDENT',
      schoolId: user.schoolId,
    },
  });

  // Get total courses
  const totalCourses = await prisma.course.count({
    where: {
      schoolId: user.schoolId,
    },
  });

  // Get total exams
  const totalExams = await prisma.exam.count({
    where: {
      course: {
        schoolId: user.schoolId,
      },
    },
  });

  // Get average score from exam submissions
  const examSubmissions = await prisma.examSubmission.findMany({
    where: {
      exam: {
        course: {
          schoolId: user.schoolId,
        },
      },
      percentage: { not: null },
    },
    select: {
      percentage: true,
    },
  });

  const averageScore = examSubmissions.length > 0
    ? examSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / examSubmissions.length
    : 0;

  // Get completion rate (students who completed at least one course)
  const completedStudentsResult = await prisma.courseStudent.groupBy({
    by: ['studentId'],
    where: {
      course: {
        schoolId: user.schoolId,
      },
      progress: { gte: 100 },
    },
  });
  const completedStudents = completedStudentsResult.length;

  const completionRate = totalStudents > 0
    ? (completedStudents / totalStudents) * 100
    : 0;

  // Get active users (students who accessed in last 7 days) - mock for now
  const activeUsers = totalStudents; // TODO: Implement actual active user tracking

  return {
    totalStudents,
    totalCourses,
    totalExams,
    averageScore,
    completionRate,
    activeUsers,
  };
};

export const getAdminDashboardStats = async () => {
  // Get total schools
  const totalSchools = await prisma.school.count();

  // Get total users
  const totalUsers = await prisma.user.count();

  // Get total revenue (mock for now)
  const totalRevenue = 1250000; // TODO: Implement actual revenue calculation

  // Get growth rate (mock for now)
  const growthRate = 15; // TODO: Implement actual growth calculation

  return {
    totalSchools,
    totalUsers,
    totalRevenue,
    growthRate,
  };
};

export const getTeacherDashboardStats = async (user: AuthUser) => {
  if (user.role !== 'TEACHER') {
    throw new Error('Unauthorized');
  }

  // Get courses where user is instructor or teacher
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: user.id },
        { teachers: { some: { teacherId: user.id } } },
      ],
    },
    include: {
      students: true,
      exams: true,
    },
  });

  const totalCourses = courses.length;
  const totalStudents = courses.reduce((sum, c) => sum + c.students.length, 0);
  const totalExams = courses.reduce((sum, c) => sum + c.exams.length, 0);

  // Get pending grading tasks (exams)
  const pendingExamGradingTasks = await prisma.gradingTask.count({
    where: {
      status: 'pending',
      submission: {
        exam: {
          course: {
            OR: [
              { instructorId: user.id },
              { teachers: { some: { teacherId: user.id } } },
            ],
          },
        },
      },
    },
  });

  // Get pending assignment grading tasks
  const pendingAssignmentGradingTasks = await prisma.assignmentSubmission.count({
    where: {
      score: null,
      submittedAt: { not: null },
      assignment: {
        course: {
          OR: [
            { instructorId: user.id },
            { teachers: { some: { teacherId: user.id } } },
          ],
        },
      },
    },
  });

  const pendingGradingTasks = pendingExamGradingTasks + pendingAssignmentGradingTasks;

  return {
    totalCourses,
    totalStudents,
    totalExams,
    pendingGradingTasks,
  };
};

export const getStudentDashboardStats = async (user: AuthUser) => {
  if (user.role !== 'STUDENT') {
    throw new Error('Unauthorized');
  }

  // Get enrolled courses
  const enrolledCourses = await prisma.courseStudent.findMany({
    where: {
      studentId: user.id,
    },
    include: {
      course: {
        include: {
          liveSessions: {
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
              status: { in: ['SCHEDULED', 'LIVE'] },
            },
          },
        },
      },
    },
  });

  const totalCourses = enrolledCourses.length;
  const todaySessions = enrolledCourses.flatMap(ec => ec.course.liveSessions || []);
  const completedCourses = enrolledCourses.filter(ec => ec.progress >= 100).length;
  const certificates = completedCourses; // Same as completed courses

  return {
    totalCourses,
    todaySessions: todaySessions.length,
    completedCourses,
    certificates,
  };
};


