import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export interface SubmitExamData {
  examId: string;
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
  timeSpent?: number; // in minutes
}

export const getExamsByCourse = async (courseId: string, user: AuthUser) => {
  // Check if course exists
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

  const exams = await prisma.exam.findMany({
    where: { courseId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return exams;
};

export const submitExam = async (
  data: SubmitExamData,
  user: AuthUser
) => {
  // Verify exam exists
  const exam = await prisma.exam.findUnique({
    where: { id: data.examId },
    include: {
      examQuestions: {
        include: {
          question: {
            include: {
              options: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      course: true,
    },
  });

  if (!exam) {
    throw new Error('ไม่พบข้อสอบ');
  }

  // Check if user is student
  if (user.role !== 'STUDENT') {
    throw new Error('เฉพาะนักเรียนเท่านั้นที่สามารถส่งข้อสอบได้');
  }

  // Check if student is enrolled in the course
  const enrollment = await prisma.courseStudent.findUnique({
    where: {
      courseId_studentId: {
        courseId: exam.courseId,
        studentId: user.id,
      },
    },
  });

  if (!enrollment) {
    throw new Error('คุณไม่ได้ลงทะเบียนในหลักสูตรนี้');
  }

  // Check if exam is active
  const now = new Date();
  if (now < exam.startDate || now > exam.endDate) {
    throw new Error('ข้อสอบยังไม่เปิดหรือหมดเวลาแล้ว');
  }

  // Check if already submitted
  const existingSubmission = await prisma.examSubmission.findFirst({
    where: {
      examId: data.examId,
      studentId: user.id,
    },
  });

  if (existingSubmission) {
    throw new Error('คุณได้ส่งข้อสอบนี้แล้ว');
  }

  // Use transaction to ensure data consistency
  const submission = await prisma.$transaction(async (tx) => {
    // Create exam submission
    const examSubmission = await tx.examSubmission.create({
      data: {
        examId: data.examId,
        studentId: user.id,
        timeSpent: data.timeSpent || null,
      },
    });

    // Process answers and create grading tasks for essay questions
    const gradingTasksToCreate: Array<{
      submissionId: string;
      questionId: string;
      studentId: string;
      answer: string;
      aiScore?: number;
      aiFeedback?: string;
    }> = [];

    for (const answerData of data.answers) {
      const examQuestion = exam.examQuestions.find(
        (eq) => eq.questionId === answerData.questionId
      );

      if (!examQuestion) {
        continue; // Skip if question not in exam
      }

      const question = examQuestion.question;
      const questionType = question.type.toUpperCase();

      // Determine if answer is correct and calculate points
      let isCorrectValue: boolean | null = null;
      let pointsValue: number | null = null;

      if (questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') {
        // For multiple choice and true/false, check if selected option is correct
        const selectedOption = question.options.find(
          (opt) => opt.text.trim() === answerData.answer.trim()
        );
        isCorrectValue = selectedOption ? selectedOption.isCorrect : false;
        pointsValue = isCorrectValue ? question.points : 0;
      } else if (questionType === 'SHORT_ANSWER') {
        // For short answer, check if answer matches any correct option
        const normalizedAnswer = answerData.answer.toLowerCase().trim();
        const isAnswerCorrect = question.options.some(
          (opt) => opt.isCorrect && opt.text.toLowerCase().trim() === normalizedAnswer
        );
        isCorrectValue = isAnswerCorrect;
        pointsValue = isAnswerCorrect ? question.points : 0;
      }

      // Create exam answer
      await tx.examAnswer.create({
        data: {
          submissionId: examSubmission.id,
          questionId: answerData.questionId,
          answer: answerData.answer,
          isCorrect: isCorrectValue,
          points: pointsValue,
        },
      });

      // For essay questions, create grading task without AI feedback
      // AI feedback will be generated automatically when teacher views the grading page
      if (questionType === 'ESSAY') {
        gradingTasksToCreate.push({
          submissionId: examSubmission.id,
          questionId: answerData.questionId,
          studentId: user.id,
          answer: answerData.answer,
          // Don't set aiScore and aiFeedback here - let getGradingTasks generate it
          // This prevents mock data from being saved
        });
      }
    }

    // Create grading tasks
    if (gradingTasksToCreate.length > 0) {
      await tx.gradingTask.createMany({
        data: gradingTasksToCreate,
      });
    }

    // Calculate score for non-essay questions
    const answers = await tx.examAnswer.findMany({
      where: { submissionId: examSubmission.id },
      include: {
        submission: {
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
          },
        },
      },
    });

    const totalScore = answers.reduce((sum, ans) => sum + (ans.points || 0), 0);
    const maxScore = exam.examQuestions.reduce(
      (sum, eq) => sum + eq.question.points,
      0
    );
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Update submission with initial score (will be updated when all grading tasks are done)
    await tx.examSubmission.update({
      where: { id: examSubmission.id },
      data: {
        score: totalScore,
        percentage,
        // Only mark as passed if no essay questions (will be updated later)
        passed: gradingTasksToCreate.length === 0 ? percentage >= exam.passingScore : null,
      },
    });

    return examSubmission;
  });

  return submission;
};
