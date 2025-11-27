import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getQuizQuestions = async (
  contentId: string,
  user: AuthUser
) => {
  // Get lesson content with quiz settings
  const content = await prisma.lessonContent.findUnique({
    where: { id: contentId },
    include: {
      lesson: {
        include: {
          course: {
            include: {
              questionBank: true,
            },
          },
        },
      },
      quizSettings: {
        include: {
          categorySelections: true,
        },
      },
    },
  });

  if (!content) {
    throw new Error('ไม่พบเนื้อหา');
  }

  // Check if content is quiz
  if (content.type !== 'QUIZ' && content.type !== 'PRE_TEST') {
    throw new Error('เนื้อหานี้ไม่ใช่แบบทดสอบ');
  }

  // Check if user has access to course
  const course = content.lesson.course;
  if (user.role === 'STUDENT') {
    const enrollment = await prisma.courseStudent.findUnique({
      where: {
        courseId_studentId: {
          courseId: course.id,
          studentId: user.id,
        },
      },
    });

    if (!enrollment) {
      throw new Error('คุณไม่ได้ลงทะเบียนในหลักสูตรนี้');
    }
  } else if (user.role === 'SCHOOL_ADMIN' && course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้');
  }

  // Check if quiz settings exist
  if (!content.quizSettings) {
    throw new Error('ไม่พบการตั้งค่าแบบทดสอบ');
  }

  // Check if question bank exists
  if (!course.questionBank) {
    throw new Error('ไม่พบคลังข้อสอบสำหรับหลักสูตรนี้');
  }

  const questionBankId = course.questionBank.id;
  const categorySelections = content.quizSettings.categorySelections || [];

  // Collect all questions from selected categories
  const allQuestions: any[] = [];

  for (const selection of categorySelections) {
    const where: any = {
      questionBankId,
      categoryId: selection.categoryId,
    };

    if (selection.difficulty) {
      where.difficulty = selection.difficulty.toUpperCase();
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
      take: selection.questionCount || 10, // Limit by questionCount
    });

    allQuestions.push(...questions);
  }

  // Shuffle questions if needed (randomize order)
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);

  // Limit total questions if specified
  const totalQuestions = content.quizSettings.totalQuestions || shuffled.length;
  const selectedQuestions = shuffled.slice(0, totalQuestions);

  return {
    quizSettings: {
      totalQuestions: content.quizSettings.totalQuestions,
      duration: content.quizSettings.duration,
      passingPercentage: content.quizSettings.passingPercentage || 70,
      maxAttempts: content.quizSettings.maxAttempts,
    },
    questions: selectedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type.toLowerCase(),
      points: q.points,
      explanation: q.explanation,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
    })),
  };
};

