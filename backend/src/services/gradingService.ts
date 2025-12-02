import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { GradingSystemType } from '@prisma/client';

export interface CreateGradingSystemData {
  courseId: string;
  systemType: 'PASS_FAIL' | 'GRADE';
  passingScore?: number;
}

export interface UpdateGradingSystemData {
  systemType?: 'PASS_FAIL' | 'GRADE';
  passingScore?: number;
}

export interface CreateGradeCriteriaData {
  gradingSystemId: string;
  grade: string;
  minScore: number;
  maxScore?: number;
}

export interface UpdateGradeCriteriaData {
  grade?: string;
  minScore?: number;
  maxScore?: number;
}

export interface CreateGradeWeightData {
  courseId: string;
  category: string;
  weight: number;
}

export interface UpdateGradeWeightData {
  category?: string;
  weight?: number;
}

export const getGradingSystem = async (courseId: string, user: AuthUser) => {
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

  const gradingSystem = await prisma.gradingSystem.findUnique({
    where: { courseId },
    include: {
      criteria: {
        orderBy: {
          minScore: 'desc',
        },
      },
    },
  });

  const gradeWeights = await prisma.gradeWeight.findMany({
    where: { courseId },
    orderBy: {
      category: 'asc',
    },
  });

  return {
    gradingSystem,
    gradeWeights,
  };
};

export const createGradingSystem = async (data: CreateGradingSystemData, user: AuthUser) => {
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission (only admin and teachers can create grading system)
  const isTeacher = course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: data.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ตั้งค่าระบบเกรด');
  }

  // Check if already exists
  const existing = await prisma.gradingSystem.findUnique({
    where: { courseId: data.courseId },
  });

  if (existing) {
    throw new Error('ระบบเกรดถูกตั้งค่าแล้ว กรุณาใช้การอัพเดทแทน');
  }

  const gradingSystem = await prisma.gradingSystem.create({
    data: {
      courseId: data.courseId,
      systemType: data.systemType as GradingSystemType,
      passingScore: data.passingScore || null,
    },
  });

  return gradingSystem;
};

export const updateGradingSystem = async (courseId: string, data: UpdateGradingSystemData, user: AuthUser) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  const isTeacher = course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์แก้ไขระบบเกรด');
  }

  const gradingSystem = await prisma.gradingSystem.update({
    where: { courseId },
    data: {
      systemType: data.systemType as GradingSystemType | undefined,
      passingScore: data.passingScore,
    },
  });

  return gradingSystem;
};

export const createGradeCriteria = async (data: CreateGradeCriteriaData, user: AuthUser) => {
  const gradingSystem = await prisma.gradingSystem.findUnique({
    where: { id: data.gradingSystemId },
    include: {
      course: true,
    },
  });

  if (!gradingSystem) {
    throw new Error('ไม่พบระบบเกรด');
  }

  // Check permission
  const isTeacher = gradingSystem.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && gradingSystem.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: gradingSystem.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์สร้างเกณฑ์การให้เกรด');
  }

  if (gradingSystem.systemType !== 'GRADE') {
    throw new Error('ระบบเกรดต้องเป็นแบบ GRADE เท่านั้น');
  }

  const criteria = await prisma.gradeCriteria.create({
    data: {
      gradingSystemId: data.gradingSystemId,
      grade: data.grade,
      minScore: data.minScore,
      maxScore: data.maxScore || null,
    },
  });

  return criteria;
};

export const updateGradeCriteria = async (criteriaId: string, data: UpdateGradeCriteriaData, user: AuthUser) => {
  const criteria = await prisma.gradeCriteria.findUnique({
    where: { id: criteriaId },
    include: {
      gradingSystem: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!criteria) {
    throw new Error('ไม่พบเกณฑ์การให้เกรด');
  }

  // Check permission
  const isTeacher = criteria.gradingSystem.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && criteria.gradingSystem.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: criteria.gradingSystem.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์แก้ไขเกณฑ์การให้เกรด');
  }

  const updated = await prisma.gradeCriteria.update({
    where: { id: criteriaId },
    data: {
      grade: data.grade,
      minScore: data.minScore,
      maxScore: data.maxScore,
    },
  });

  return updated;
};

export const deleteGradeCriteria = async (criteriaId: string, user: AuthUser) => {
  const criteria = await prisma.gradeCriteria.findUnique({
    where: { id: criteriaId },
    include: {
      gradingSystem: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!criteria) {
    throw new Error('ไม่พบเกณฑ์การให้เกรด');
  }

  // Check permission
  const isTeacher = criteria.gradingSystem.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && criteria.gradingSystem.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: criteria.gradingSystem.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ลบเกณฑ์การให้เกรด');
  }

  await prisma.gradeCriteria.delete({
    where: { id: criteriaId },
  });

  return { success: true };
};

export const createGradeWeight = async (data: CreateGradeWeightData, user: AuthUser) => {
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  const isTeacher = course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: data.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์สร้างน้ำหนักคะแนน');
  }

  // Check if category already exists
  const existing = await prisma.gradeWeight.findUnique({
    where: {
      courseId_category: {
        courseId: data.courseId,
        category: data.category,
      },
    },
  });

  if (existing) {
    throw new Error('หมวดหมู่นี้ถูกตั้งค่าแล้ว กรุณาใช้การอัพเดทแทน');
  }

  // Validate total weight
  const existingWeights = await prisma.gradeWeight.findMany({
    where: { courseId: data.courseId },
  });

  const totalWeight = existingWeights.reduce((sum, w) => sum + w.weight, 0) + data.weight;

  if (totalWeight > 100) {
    throw new Error(`น้ำหนักรวมเกิน 100% (ปัจจุบัน: ${totalWeight}%)`);
  }

  const weight = await prisma.gradeWeight.create({
    data: {
      courseId: data.courseId,
      category: data.category,
      weight: data.weight,
    },
  });

  return weight;
};

export const updateGradeWeight = async (weightId: string, data: UpdateGradeWeightData, user: AuthUser) => {
  const weight = await prisma.gradeWeight.findUnique({
    where: { id: weightId },
    include: {
      course: true,
    },
  });

  if (!weight) {
    throw new Error('ไม่พบน้ำหนักคะแนน');
  }

  // Check permission
  const isTeacher = weight.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && weight.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: weight.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์แก้ไขน้ำหนักคะแนน');
  }

  // Validate total weight if weight is being updated
  if (data.weight !== undefined) {
    const existingWeights = await prisma.gradeWeight.findMany({
      where: {
        courseId: weight.courseId,
        id: { not: weightId },
      },
    });

    const totalWeight = existingWeights.reduce((sum, w) => sum + w.weight, 0) + data.weight;

    if (totalWeight > 100) {
      throw new Error(`น้ำหนักรวมเกิน 100% (ปัจจุบัน: ${totalWeight}%)`);
    }
  }

  const updated = await prisma.gradeWeight.update({
    where: { id: weightId },
    data: {
      category: data.category,
      weight: data.weight,
    },
  });

  return updated;
};

export const deleteGradeWeight = async (weightId: string, user: AuthUser) => {
  const weight = await prisma.gradeWeight.findUnique({
    where: { id: weightId },
    include: {
      course: true,
    },
  });

  if (!weight) {
    throw new Error('ไม่พบน้ำหนักคะแนน');
  }

  // Check permission
  const isTeacher = weight.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && weight.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: weight.courseId,
      teacherId: user.id,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ลบน้ำหนักคะแนน');
  }

  await prisma.gradeWeight.delete({
    where: { id: weightId },
  });

  return { success: true };
};

// Calculate final grade for a student
export const calculateStudentGrade = async (courseId: string, studentId: string) => {
  const gradingSystem = await prisma.gradingSystem.findUnique({
    where: { courseId },
    include: {
      criteria: {
        orderBy: {
          minScore: 'desc',
        },
      },
    },
  });

  if (!gradingSystem) {
    return null;
  }

  const gradeWeights = await prisma.gradeWeight.findMany({
    where: { courseId },
  });

  // Get all scores by category
  const scores: Record<string, number[]> = {};

  // Get quiz scores
  const quizScores = await prisma.examSubmission.findMany({
    where: {
      studentId,
      exam: {
        courseId,
        type: 'QUIZ',
      },
    },
    select: {
      score: true,
    },
  });
  if (quizScores.length > 0) {
    scores['quiz'] = quizScores.map((s) => s.score || 0);
  }

  // Get assignment scores
  const assignmentScores = await prisma.assignmentSubmission.findMany({
    where: {
      studentId,
      assignment: {
        courseId,
      },
      score: { not: null },
    },
    select: {
      score: true,
    },
  });
  if (assignmentScores.length > 0) {
    scores['assignment'] = assignmentScores.map((s) => s.score || 0);
  }

  // Get exam scores
  const examScores = await prisma.examSubmission.findMany({
    where: {
      studentId,
      exam: {
        courseId,
        type: { in: ['MIDTERM', 'FINAL'] },
      },
    },
    select: {
      score: true,
    },
  });
  if (examScores.length > 0) {
    scores['exam'] = examScores.map((s) => s.score || 0);
  }

  // Calculate weighted average
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const weight of gradeWeights) {
    const categoryScores = scores[weight.category] || [];
    if (categoryScores.length > 0) {
      const avgScore = categoryScores.reduce((sum, s) => sum + s, 0) / categoryScores.length;
      totalWeightedScore += (avgScore / 100) * weight.weight; // Convert to percentage
      totalWeight += weight.weight;
    }
  }

  if (totalWeight === 0) {
    return null;
  }

  const finalPercentage = (totalWeightedScore / totalWeight) * 100;

  // Determine grade based on system type
  if (gradingSystem.systemType === 'PASS_FAIL') {
    const passingScore = gradingSystem.passingScore || 70;
    return {
      percentage: finalPercentage,
      grade: finalPercentage >= passingScore ? 'ผ่าน' : 'ไม่ผ่าน',
      systemType: 'PASS_FAIL',
    };
  } else {
    // GRADE system
    for (const criteria of gradingSystem.criteria) {
      if (finalPercentage >= criteria.minScore) {
        return {
          percentage: finalPercentage,
          grade: criteria.grade,
          systemType: 'GRADE',
        };
      }
    }
    return {
      percentage: finalPercentage,
      grade: 'F',
      systemType: 'GRADE',
    };
  }
};

// Legacy functions for backward compatibility
export const getGradingTasks = async (user: AuthUser) => {
  const tasks = await prisma.gradingTask.findMany({
    where: {
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
      status: 'pending',
    },
    include: {
      submission: {
        include: {
          exam: {
            include: {
              course: true,
        },
      },
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tasks;
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
    throw new Error('ไม่พบงานที่ต้องให้คะแนน');
  }

  // Check permission
  const isTeacher = task.submission.exam.course.instructorId === user.id;
  const isAdmin = user.role === 'SUPER_ADMIN' || (user.role === 'SCHOOL_ADMIN' && task.submission.exam.course.schoolId === user.schoolId);
  const isCourseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId: task.submission.exam.courseId,
        teacherId: user.id,
      grading: true,
    },
  });

  if (!isTeacher && !isAdmin && !isCourseTeacher) {
    throw new Error('ไม่มีสิทธิ์ให้คะแนน');
  }

  const updated = await prisma.gradingTask.update({
    where: { id: taskId },
    data: {
      teacherScore,
      teacherFeedback,
      status: 'completed',
    },
  });

  // Update exam submission score
  const allTasks = await prisma.gradingTask.findMany({
    where: { submissionId: task.submissionId },
  });

  const totalScore = allTasks.reduce((sum: number, t: any) => {
    return sum + (t.teacherScore || t.aiScore || 0);
  }, 0);

  const exam = await prisma.exam.findUnique({
    where: { id: task.submission.examId },
    include: {
      examQuestions: {
        include: {
          question: true,
        },
      },
    },
  });

  if (exam) {
    const maxScore = exam.examQuestions.reduce((sum, eq) => sum + eq.question.points, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    await prisma.examSubmission.update({
      where: { id: task.submissionId },
      data: {
        score: totalScore,
        percentage,
      },
    });
  }

  return updated;
};

// AI Grading function (placeholder - can be implemented with OpenAI or other AI service)
export const gradeWithAI = async (
  question: string,
  answer: string,
  correctAnswer: string | undefined,
  maxPoints: number
): Promise<{ score: number; feedback: string }> => {
  // TODO: Implement AI grading with OpenAI or other service
  // For now, return a simple score based on keyword matching
  let score = 0;
  let feedback = '';

  if (correctAnswer) {
    // Simple keyword matching (can be replaced with AI)
    const answerLower = answer.toLowerCase();
    const correctLower = correctAnswer.toLowerCase();
    const keywords = correctLower.split(' ').filter((w) => w.length > 3);
    const matchedKeywords = keywords.filter((keyword) => answerLower.includes(keyword));
    score = Math.round((matchedKeywords.length / keywords.length) * maxPoints);
    feedback = matchedKeywords.length > 0
      ? `พบคำสำคัญที่เกี่ยวข้อง ${matchedKeywords.length} จาก ${keywords.length} คำ`
      : 'ไม่พบคำสำคัญที่เกี่ยวข้อง';
  } else {
    // If no correct answer, give partial credit based on answer length
    score = Math.min(Math.round(answer.length / 50 * maxPoints), maxPoints);
    feedback = 'คำตอบได้รับการตรวจสอบแล้ว';
  }

  return { score, feedback };
};
