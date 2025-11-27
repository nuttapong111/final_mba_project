import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { hashPassword } from '../utils/bcrypt';

export const getUsers = async (user: AuthUser) => {
  let where: any = {};

  // Filter by role
  if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    where.schoolId = user.schoolId;
  } else if (user.role === 'TEACHER') {
    // Teachers see students from courses they teach
    const teacherCourses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId: user.id },
          { teachers: { some: { teacherId: user.id } } },
        ],
      },
      select: { id: true },
    });

    const courseIds = teacherCourses.map((c) => c.id);
    const studentIds = await prisma.courseStudent.findMany({
      where: { courseId: { in: courseIds } },
      select: { studentId: true },
      distinct: ['studentId'],
    });

    where.id = { in: studentIds.map((s) => s.studentId) };
  } else if (user.role === 'STUDENT') {
    // Students see teachers from courses they enrolled
    const enrolledCourses = await prisma.courseStudent.findMany({
      where: { studentId: user.id },
      select: { courseId: true },
    });

    const courseIds = enrolledCourses.map((c) => c.courseId);
    const teacherIds = await prisma.courseTeacher.findMany({
      where: { courseId: { in: courseIds } },
      select: { teacherId: true },
      distinct: ['teacherId'],
    });

    const instructorIds = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { instructorId: true },
      distinct: ['instructorId'],
    });

    where.id = {
      in: [
        ...teacherIds.map((t) => t.teacherId),
        ...instructorIds.map((i) => i.instructorId),
      ],
    };
  }
  // SUPER_ADMIN sees all users

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      schoolId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

export const bulkImportUsers = async (users: Array<{
  name: string;
  email: string;
  role: string;
  password?: string;
  schoolId?: string;
}>, schoolId?: string) => {
  const results = {
    success: [] as any[],
    failed: [] as Array<{ user: any; error: string }>,
  };

  for (const userData of users) {
    try {
      // Validate
      if (!userData.name || !userData.email || !userData.role) {
        results.failed.push({
          user: userData,
          error: 'ข้อมูลไม่ครบถ้วน',
        });
        continue;
      }

      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        results.failed.push({
          user: userData,
          error: 'อีเมลนี้ถูกใช้งานแล้ว',
        });
        continue;
      }

      // Generate default password if not provided
      const password = userData.password || 'password123';
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role as any,
          schoolId: userData.schoolId || schoolId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      });

      results.success.push(user);
    } catch (error: any) {
      results.failed.push({
        user: userData,
        error: error.message || 'เกิดข้อผิดพลาด',
      });
    }
  }

  return results;
};

export const createUser = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  schoolId?: string;
}, currentUser: AuthUser) => {
  // Validate required fields
  if (!userData.name || !userData.email || !userData.password || !userData.role) {
    throw new Error('ข้อมูลไม่ครบถ้วน');
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existing) {
    throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
  }

  // Role validation
  const validRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'];
  if (!validRoles.includes(userData.role.toUpperCase())) {
    throw new Error('บทบาทไม่ถูกต้อง');
  }

  // School Admin can only create users for their school
  if (currentUser.role === 'SCHOOL_ADMIN') {
    if (!currentUser.schoolId) {
      throw new Error('ไม่พบข้อมูลโรงเรียน');
    }
    // School Admin cannot create SUPER_ADMIN
    if (userData.role.toUpperCase() === 'SUPER_ADMIN') {
      throw new Error('ไม่มีสิทธิ์สร้างผู้ดูแลระบบหลัก');
    }
    // Force schoolId to current user's school
    userData.schoolId = currentUser.schoolId;
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role.toUpperCase() as any,
      schoolId: userData.schoolId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      schoolId: true,
      createdAt: true,
    },
  });

  return user;
};

