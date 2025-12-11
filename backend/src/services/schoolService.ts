import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export interface SchoolData {
  id: string;
  name: string;
  domain?: string;
  subscription?: string;
  createdAt: Date;
  adminCount?: number;
  userCount?: number;
}

/**
 * Get all schools (Super Admin only)
 */
export const getAllSchools = async (user: AuthUser): Promise<SchoolData[]> => {
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลสถาบันทั้งหมด');
  }

  const schools = await prisma.school.findMany({
    include: {
      users: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return schools.map((school) => ({
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription || undefined,
    createdAt: school.createdAt,
    adminCount: school.users.filter((u) => u.role === 'SCHOOL_ADMIN').length,
    userCount: school.users.length,
  }));
};

/**
 * Get school by ID
 */
export const getSchoolById = async (schoolId: string, user: AuthUser): Promise<SchoolData | null> => {
  if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลสถาบันนี้');
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      users: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!school) return null;

  return {
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription || undefined,
    createdAt: school.createdAt,
    adminCount: school.users.filter((u) => u.role === 'SCHOOL_ADMIN').length,
    userCount: school.users.length,
  };
};
