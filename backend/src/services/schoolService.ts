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

  console.log('[SCHOOL SERVICE] Fetching all schools...');
  const startTime = Date.now();

  // Use _count for better performance instead of including all users
  const schools = await prisma.school.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const queryTime = Date.now() - startTime;
  console.log(`[SCHOOL SERVICE] Found ${schools.length} schools in ${queryTime}ms`);
  
  if (schools.length === 0) {
    console.log('[SCHOOL SERVICE] No schools found in database');
    return [];
  }

  // Get admin counts separately using findMany for better performance
  const schoolIds = schools.map((s) => s.id);
  const adminCountMap = new Map<string, number>();
  
  if (schoolIds.length > 0) {
    try {
      // Initialize all schools with 0 admin count
      schoolIds.forEach((id) => adminCountMap.set(id, 0));
      
      // Get all school admins for these schools
      const schoolAdmins = await prisma.user.findMany({
        where: {
          schoolId: { in: schoolIds },
          role: 'SCHOOL_ADMIN',
        },
        select: {
          schoolId: true,
        },
      });
      
      // Count admins per school
      schoolAdmins.forEach((admin) => {
        if (admin.schoolId) {
          const currentCount = adminCountMap.get(admin.schoolId) || 0;
          adminCountMap.set(admin.schoolId, currentCount + 1);
        }
      });
    } catch (error) {
      console.error('[SCHOOL SERVICE] Error getting admin counts:', error);
      // Continue without admin counts (all will be 0)
    }
  }

  const result = schools.map((school) => ({
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: adminCountMap.get(school.id) || 0,
    userCount: school._count.users,
  }));

  const totalTime = Date.now() - startTime;
  console.log(`[SCHOOL SERVICE] Processed ${result.length} schools in ${totalTime}ms`);
  return result;
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
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!school) return null;

  // Get admin count separately
  const adminCount = await prisma.user.count({
    where: {
      schoolId: school.id,
      role: 'SCHOOL_ADMIN',
    },
  });

  return {
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: adminCount,
    userCount: school._count.users,
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
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  // Get admin count (should be 0 for new school)
  const adminCount = await prisma.user.count({
    where: {
      schoolId: school.id,
      role: 'SCHOOL_ADMIN',
    },
  });

  return {
    id: school.id,
    name: school.name,
    domain: school.domain || undefined,
    subscription: school.subscription,
    createdAt: school.createdAt,
    adminCount: adminCount,
    userCount: school._count.users,
  };
};
