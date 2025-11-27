import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getQuestionBankByCourse = async (courseId: string, user: AuthUser) => {
  // Verify course exists and user has permission
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงหลักสูตรนี้');
  }

  // Get or create question bank for this course
  let questionBank = await prisma.questionBank.findFirst({
    where: { courseId },
    include: {
      categories: {
        include: {
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  // If no question bank exists, create one
  if (!questionBank) {
    questionBank = await prisma.questionBank.create({
      data: {
        courseId,
        name: `คลังข้อสอบ - ${course.title}`,
        description: `คลังข้อสอบสำหรับหลักสูตร ${course.title}`,
        categories: {
          create: [],
        },
      },
      include: {
        categories: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  return questionBank;
};

export const createQuestionCategory = async (
  questionBankId: string,
  data: { name: string; description?: string },
  user: AuthUser
) => {
  const questionBank = await prisma.questionBank.findUnique({
    where: { id: questionBankId },
    include: { course: true },
  });

  if (!questionBank) {
    throw new Error('ไม่พบคลังข้อสอบ');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && questionBank.course?.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์สร้างหมวดหมู่ในคลังข้อสอบนี้');
  }

  if (!data.name || !data.name.trim()) {
    throw new Error('กรุณากรอกชื่อหมวดหมู่');
  }

  // Check if category name already exists in this question bank
  const existing = await prisma.questionCategory.findFirst({
    where: {
      questionBankId,
      name: data.name.trim(),
    },
  });

  if (existing) {
    throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้วในคลังข้อสอบนี้');
  }

  const category = await prisma.questionCategory.create({
    data: {
      questionBankId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  return category;
};

export const updateQuestionCategory = async (
  categoryId: string,
  data: { name?: string; description?: string },
  user: AuthUser
) => {
  const category = await prisma.questionCategory.findUnique({
    where: { id: categoryId },
    include: {
      questionBank: {
        include: { course: true },
      },
    },
  });

  if (!category) {
    throw new Error('ไม่พบหมวดหมู่');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && category.questionBank.course?.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์แก้ไขหมวดหมู่นี้');
  }

  if (data.name && data.name.trim() && data.name.trim() !== category.name) {
    // Check if new name conflicts with existing category
    const existing = await prisma.questionCategory.findFirst({
      where: {
        questionBankId: category.questionBankId,
        name: data.name.trim(),
        id: { not: categoryId },
      },
    });

    if (existing) {
      throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้วในคลังข้อสอบนี้');
    }
  }

  const updatedCategory = await prisma.questionCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name?.trim(),
      description: data.description?.trim(),
    },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

  return updatedCategory;
};

export const deleteQuestionCategory = async (categoryId: string, user: AuthUser) => {
  const category = await prisma.questionCategory.findUnique({
    where: { id: categoryId },
    include: {
      questionBank: {
        include: { course: true },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!category) {
    throw new Error('ไม่พบหมวดหมู่');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && category.questionBank.course?.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์ลบหมวดหมู่นี้');
  }

  if (category._count.questions > 0) {
    throw new Error('ไม่สามารถลบหมวดหมู่ที่มีข้อสอบอยู่ได้');
  }

  await prisma.questionCategory.delete({
    where: { id: categoryId },
  });

  return { message: 'ลบหมวดหมู่สำเร็จ' };
};

export const getQuestionsByQuestionBank = async (
  questionBankId: string,
  user: AuthUser,
  filters?: {
    categoryId?: string;
    difficulty?: string;
    search?: string;
  }
) => {
  const questionBank = await prisma.questionBank.findUnique({
    where: { id: questionBankId },
    include: { course: true },
  });

  if (!questionBank) {
    throw new Error('ไม่พบคลังข้อสอบ');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && questionBank.course?.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงคลังข้อสอบนี้');
  }

  const where: any = {
    questionBankId,
  };

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty.toUpperCase();
  }

  if (filters?.search) {
    where.question = {
      contains: filters.search,
      mode: 'insensitive',
    };
  }

  const questions = await prisma.question.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      options: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return questions;
};

