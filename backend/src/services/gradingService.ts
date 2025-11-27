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

// AI Grading Service (Mock implementation - can be replaced with actual AI service)
export const gradeWithAI = async (
  question: string,
  studentAnswer: string,
  correctAnswer?: string,
  points: number = 100
): Promise<{ score: number; feedback: string }> => {
  // Mock AI grading - in production, this would call an actual AI service
  // For now, we'll do a simple keyword matching and length analysis
  
  const answerLength = studentAnswer.trim().length;
  const questionLength = question.length;
  
  // Simple scoring logic (can be replaced with actual AI)
  let score = 0;
  let feedback = '';
  
  if (answerLength === 0) {
    score = 0;
    feedback = 'ไม่มีการตอบคำถาม';
  } else if (answerLength < 50) {
    score = Math.min(30, points * 0.3);
    feedback = 'คำตอบสั้นเกินไป ควรอธิบายให้ละเอียดมากขึ้น';
  } else if (answerLength < 100) {
    score = Math.min(60, points * 0.6);
    feedback = 'คำตอบดี แต่ควรอธิบายให้ละเอียดมากขึ้น';
  } else if (answerLength < 200) {
    score = Math.min(80, points * 0.8);
    feedback = 'คำตอบดี มีการอธิบายที่ชัดเจน';
  } else {
    score = Math.min(95, points * 0.95);
    feedback = 'คำตอบดีมาก มีการอธิบายที่ละเอียดและชัดเจน';
  }
  
  // If correct answer is provided, do keyword matching
  if (correctAnswer && correctAnswer.trim()) {
    const correctKeywords = correctAnswer.toLowerCase().split(/\s+/);
    const answerKeywords = studentAnswer.toLowerCase().split(/\s+/);
    const matchedKeywords = correctKeywords.filter(keyword => 
      answerKeywords.some(ans => ans.includes(keyword) || keyword.includes(ans))
    );
    const keywordMatchRatio = matchedKeywords.length / correctKeywords.length;
    
    // Adjust score based on keyword matching
    score = Math.min(points, score * 0.7 + (points * keywordMatchRatio * 0.3));
    
    if (keywordMatchRatio > 0.7) {
      feedback += ' คำตอบมีความเกี่ยวข้องกับคำตอบที่ถูกต้อง';
    } else if (keywordMatchRatio < 0.3) {
      feedback += ' คำตอบอาจไม่ตรงกับคำตอบที่ถูกต้อง';
    }
  }
  
  // Round to 2 decimal places
  score = Math.round(score * 100) / 100;
  
  return { score, feedback };
};


