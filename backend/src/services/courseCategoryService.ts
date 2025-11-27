import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getCourseCategories = async (user: AuthUser) => {
  let where: any = {};

  // School Admin can only see categories from their school
  if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    where.schoolId = user.schoolId;
  }
  // SUPER_ADMIN can see all categories

  const categories = await prisma.courseCategory.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return categories;
};

export const createCourseCategory = async (
  data: { name: string; description?: string },
  user: AuthUser
) => {
  // Validate
  if (!data.name || !data.name.trim()) {
    throw new Error('กรุณากรอกชื่อหมวดหมู่');
  }

  // School Admin must have schoolId
  if (user.role === 'SCHOOL_ADMIN' && !user.schoolId) {
    throw new Error('ไม่พบข้อมูลโรงเรียน');
  }

  // Check if category name already exists in the same school
  const existing = await prisma.courseCategory.findUnique({
    where: {
      schoolId_name: {
        schoolId: user.schoolId!,
        name: data.name.trim(),
      },
    },
  });

  if (existing) {
    throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
  }

  // Create category
  const category = await prisma.courseCategory.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      schoolId: user.schoolId!,
    },
  });

  return category;
};

export const updateCourseCategory = async (
  id: string,
  data: { name: string; description?: string },
  user: AuthUser
) => {
  // Find category
  const category = await prisma.courseCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new Error('ไม่พบหมวดหมู่');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && category.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์แก้ไขหมวดหมู่นี้');
  }

  // Validate
  if (!data.name || !data.name.trim()) {
    throw new Error('กรุณากรอกชื่อหมวดหมู่');
  }

  // Check if new name conflicts with existing category
  if (data.name.trim() !== category.name) {
    const existing = await prisma.courseCategory.findUnique({
      where: {
        schoolId_name: {
          schoolId: category.schoolId,
          name: data.name.trim(),
        },
      },
    });

    if (existing) {
      throw new Error('ชื่อหมวดหมู่นี้มีอยู่แล้ว');
    }
  }

  // Update category
  const updated = await prisma.courseCategory.update({
    where: { id },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
  });

  return updated;
};

export const deleteCourseCategory = async (id: string, user: AuthUser) => {
  // Find category
  const category = await prisma.courseCategory.findUnique({
    where: { id },
    include: {
      courses: true,
    },
  });

  if (!category) {
    throw new Error('ไม่พบหมวดหมู่');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && category.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์ลบหมวดหมู่นี้');
  }

  // Check if category is used by courses
  if (category.courses.length > 0) {
    throw new Error('ไม่สามารถลบหมวดหมู่ได้ เนื่องจากมีหลักสูตรที่ใช้หมวดหมู่นี้อยู่');
  }

  // Delete category
  await prisma.courseCategory.delete({
    where: { id },
  });

  return { success: true };
};

