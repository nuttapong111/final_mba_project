import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { SubscriptionTier } from '@prisma/client';

export interface SchoolData {
  id: string;
  name: string;
  domain?: string;
  subscription?: SubscriptionTier;
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
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: school.users.filter((u: { role: string }) => u.role === 'SCHOOL_ADMIN').length,
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
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: school.users.filter((u: { role: string }) => u.role === 'SCHOOL_ADMIN').length,
    userCount: school.users.length,
  };
};

/**
 * Create a new school
 */
export const createSchool = async (
  data: {
    name: string;
    domain?: string;
    subscription?: SubscriptionTier | string;
  },
  user: AuthUser
): Promise<SchoolData> => {
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('ไม่มีสิทธิ์สร้างสถาบันใหม่');
  }

  // Validate and convert subscription to SubscriptionTier enum
  let subscription: SubscriptionTier = SubscriptionTier.BASIC;
  if (data.subscription) {
    const validTiers = Object.values(SubscriptionTier);
    if (typeof data.subscription === 'string' && validTiers.includes(data.subscription as SubscriptionTier)) {
      subscription = data.subscription as SubscriptionTier;
    } else if (data.subscription in SubscriptionTier) {
      subscription = data.subscription as SubscriptionTier;
    }
  }

  // Domain is required in schema, but we'll make it optional by generating a unique one if not provided
  // Use UUID to ensure uniqueness
  const { randomUUID } = await import('crypto');
  const domain = data.domain || `school-${randomUUID()}.example.com`;

  const school = await prisma.school.create({
    data: {
      name: data.name,
      domain: domain,
      subscription: subscription,
    },
    include: {
      users: {
        select: {
          role: true,
        },
      },
    },
  });

  return {
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: school.users.filter((u: { role: string }) => u.role === 'SCHOOL_ADMIN').length,
    userCount: school.users.length,
  };
};
