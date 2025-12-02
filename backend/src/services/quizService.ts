import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { submitExam, SubmitExamData } from './examService';

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
              questionBanks: true,
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

  // Check if lesson exists
  if (!content.lesson) {
    throw new Error('ไม่พบบทเรียน');
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

  // Check if question bank exists (get first question bank for the course)
  if (!course.questionBanks || course.questionBanks.length === 0) {
    throw new Error('ไม่พบคลังข้อสอบสำหรับหลักสูตรนี้');
  }

  const questionBankId = course.questionBanks[0].id;
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
      options: q.options.map((opt: { id: string; text: string; isCorrect: boolean; order: number }) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order,
      })),
    })),
  };
};

export interface SubmitQuizData {
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
  timeSpent?: number; // in minutes
}

export const submitQuiz = async (
  contentId: string,
  data: SubmitQuizData,
  user: AuthUser
) => {
  // Get lesson content with quiz settings
  const content = await prisma.lessonContent.findUnique({
    where: { id: contentId },
    include: {
      lesson: {
        include: {
          course: true,
        },
      },
      quizSettings: true,
    },
  });

  if (!content) {
    throw new Error('ไม่พบเนื้อหา');
  }

  // Check if content is quiz
  if (content.type !== 'QUIZ' && content.type !== 'PRE_TEST') {
    throw new Error('เนื้อหานี้ไม่ใช่แบบทดสอบ');
  }

  // Check if user is student
  if (user.role !== 'STUDENT') {
    throw new Error('เฉพาะนักเรียนเท่านั้นที่สามารถส่งข้อสอบได้');
  }

  // Ensure content has lesson and quizSettings
  if (!content.lesson) {
    throw new Error('ไม่พบบทเรียน');
  }

  const courseId = content.lesson.courseId;

  // Check if student is enrolled
  const enrollment = await prisma.courseStudent.findUnique({
    where: {
      courseId_studentId: {
        courseId: courseId,
        studentId: user.id,
      },
    },
  });

  if (!enrollment) {
    throw new Error('คุณไม่ได้ลงทะเบียนในหลักสูตรนี้');
  }

  // Get examId from content - examId exists in schema, so we can query it directly
  const contentWithExam = await prisma.lessonContent.findUnique({
    where: { id: contentId },
    select: { examId: true },
  });
  
  let examId = contentWithExam?.examId || null;
  
  if (!examId) {
    // Get question points from database
    const questionIds = data.answers.map(a => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, points: true },
    });

    const totalScore = questions.reduce((sum, q) => sum + q.points, 0);

    // Get examType from quizSettings (cast to any to access examType which exists in DB)
    const quizSettings = content.quizSettings as any;
    const examType = quizSettings?.examType || 'QUIZ';

    // Create exam from quiz content
    // Set dates to allow immediate submission (startDate = now, endDate = far future)
    const now = new Date();
    const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    const exam = await prisma.exam.create({
      data: {
        courseId: courseId,
        title: content.title,
        type: examType,
        duration: content.quizSettings?.duration || 60,
        totalQuestions: data.answers.length,
        totalScore: totalScore,
        startDate: now, // Always allow immediate submission
        endDate: farFuture, // Allow submission for 1 year
        passingScore: content.quizSettings?.passingPercentage || 70,
      },
    });

    examId = exam.id;

    // Link exam to content - examId exists in schema, so we can update it directly
    await prisma.lessonContent.update({
      where: { id: contentId },
      data: { examId: exam.id },
    });

    // Add questions to exam
    for (let i = 0; i < data.answers.length; i++) {
      const answer = data.answers[i];
      await prisma.examQuestion.create({
        data: {
          examId: exam.id,
          questionId: answer.questionId,
          order: i + 1,
        },
      });
    }
  }

  // Ensure examId exists
  if (!examId) {
    throw new Error('ไม่พบข้อสอบ');
  }

  // Check if already submitted (before submitting)
  // Use findUnique with compound key if available, or findFirst
  const existingSubmission = await prisma.examSubmission.findFirst({
    where: {
      examId: examId,
      studentId: user.id,
    },
    select: {
      id: true,
      score: true,
      submittedAt: true,
    },
  });

  if (existingSubmission) {
    // Return existing submission instead of throwing error
    // This prevents duplicate submission errors when auto-submit is triggered multiple times
    // Get full submission data with exam info
    const fullSubmission = await prisma.examSubmission.findUnique({
      where: { id: existingSubmission.id },
      include: {
        exam: {
          include: {
            examQuestions: {
              include: {
                question: true,
              },
            },
          },
        },
        gradingTasks: true,
        answers: true,
      },
    });

    if (!fullSubmission) {
      throw new Error('ไม่พบข้อมูลการส่งข้อสอบ');
    }

    // Check if there are essay questions
    const hasEssayQuestions = fullSubmission.gradingTasks && fullSubmission.gradingTasks.length > 0;

    return {
      id: fullSubmission.id,
      score: fullSubmission.score || 0,
      percentage: fullSubmission.percentage || 0,
      passed: fullSubmission.passed,
      totalScore: fullSubmission.exam.totalScore || 0,
      hasEssayQuestions: hasEssayQuestions,
    };
  }

  // Submit exam
  const submission = await submitExam(
    {
      examId: examId,
      answers: data.answers,
      timeSpent: data.timeSpent,
    },
    user
  );

  // Get submission with grading tasks to check if there are essay questions
  const submissionWithTasks = await prisma.examSubmission.findUnique({
    where: { id: submission.id },
    include: {
      exam: {
        include: {
          examQuestions: {
            include: {
              question: true,
            },
          },
        },
      },
      gradingTasks: true,
      answers: true,
    },
  });

  // Mark content as completed
  const { markContentCompleted } = await import('./contentProgressService');
  await markContentCompleted(contentId, courseId, user.id);

  // Return submission with additional info
  return {
    ...submission,
    totalScore: submissionWithTasks?.exam.totalScore || 0,
    percentage: submission.percentage || 0,
    hasEssayQuestions: (submissionWithTasks?.gradingTasks?.length || 0) > 0,
    gradingTasks: submissionWithTasks?.gradingTasks || [],
  };
};

