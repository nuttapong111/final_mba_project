import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getGradingTasks = async (user: AuthUser) => {
  // Get courses where user is teacher with grading role
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: user.id },
        { teachers: { some: { teacherId: user.id, grading: true } } },
      ],
    },
    select: { id: true },
  });

  const courseIds = courses.map((c) => c.id);

  const tasks = await prisma.gradingTask.findMany({
    where: {
      submission: {
        exam: {
          courseId: { in: courseIds },
        },
      },
    },
    include: {
      submission: {
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              courseId: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks.map((task) => ({
    id: task.id,
    courseId: task.submission.exam.courseId,
    courseTitle: '', // Will be filled from course lookup
    examId: task.submission.exam.id,
    examTitle: task.submission.exam.title,
    studentId: task.student.id,
    studentName: task.student.name,
    studentAvatar: task.student.avatar,
    submittedAt: task.submission.submittedAt.toISOString(),
    aiScore: task.aiScore,
    aiFeedback: task.aiFeedback,
    teacherScore: task.teacherScore,
    teacherFeedback: task.teacherFeedback,
    status: task.status,
    answer: task.answer,
  }));
};

export const updateGradingTask = async (
  taskId: string,
  teacherScore: number,
  teacherFeedback: string,
  user: AuthUser
) => {
  const task = await prisma.gradingTask.findUnique({
    where: { id: taskId },
    include: {
      submission: {
        include: {
          exam: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error('ไม่พบงานที่ต้องตรวจ');
  }

  // Check if user is teacher with grading role
  const isTeacher = await prisma.courseTeacher.findUnique({
    where: {
      courseId_teacherId: {
        courseId: task.submission.exam.course.id,
        teacherId: user.id,
      },
    },
  });

  if (
    task.submission.exam.course.instructorId !== user.id &&
    (!isTeacher || !isTeacher.grading)
  ) {
    throw new Error('ไม่มีสิทธิ์ตรวจงานนี้');
  }

  const updated = await prisma.gradingTask.update({
    where: { id: taskId },
    data: {
      teacherScore,
      teacherFeedback,
      status: 'graded',
    },
  });

  // Update exam submission score if all tasks are graded
  const allTasks = await prisma.gradingTask.findMany({
    where: { submissionId: task.submissionId },
  });

  if (allTasks.every((t) => t.status === 'graded' && t.teacherScore !== null)) {
    const totalScore = allTasks.reduce((sum, t) => sum + (t.teacherScore || 0), 0);
    const maxScore = allTasks.length * 100; // Assuming each task is worth 100 points
    const percentage = (totalScore / maxScore) * 100;

    await prisma.examSubmission.update({
      where: { id: task.submissionId },
      data: {
        score: totalScore,
        percentage,
        passed: percentage >= 70, // Assuming 70% is passing
      },
    });
  }

  return updated;
};


