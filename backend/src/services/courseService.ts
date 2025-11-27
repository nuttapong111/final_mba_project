import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getCourses = async (user: AuthUser) => {
  let where: any = {};

  // Filter by role
  if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    where.schoolId = user.schoolId;
  } else if (user.role === 'TEACHER') {
    where.OR = [
      { instructorId: user.id },
      { teachers: { some: { teacherId: user.id } } },
    ];
  } else if (user.role === 'STUDENT') {
    where.students = { some: { studentId: user.id } };
  }
  // SUPER_ADMIN sees all courses

  const courses = await prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
        },
      },
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      students: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          lessons: true,
          students: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return courses.map((course) => ({
    ...course,
    students: course._count.students,
    enrolledStudents: course.students.map((cs) => ({
      id: cs.student.id,
      name: cs.student.name,
      email: cs.student.email,
      avatar: cs.student.avatar,
      enrolledAt: cs.enrolledAt.toISOString(),
      progress: cs.progress,
    })),
    teachers: course.teachers.map((ct) => ({
      id: ct.teacher.id,
      name: ct.teacher.name,
      email: ct.teacher.email,
      avatar: ct.teacher.avatar,
      roles: {
        liveTeaching: ct.liveTeaching,
        grading: ct.grading,
        webboard: ct.webboard,
      },
      addedAt: ct.addedAt.toISOString(),
    })),
  }));
};

export const getCourseById = async (courseId: string, user: AuthUser) => {
  let where: any = { id: courseId };

  // Filter by role
  if (user.role === 'SCHOOL_ADMIN' && user.schoolId) {
    where.schoolId = user.schoolId;
  } else if (user.role === 'TEACHER') {
    where.OR = [
      { instructorId: user.id },
      { teachers: { some: { teacherId: user.id } } },
    ];
  } else if (user.role === 'STUDENT') {
    where.students = { some: { studentId: user.id } };
  }

  const course = await prisma.course.findFirst({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
        },
      },
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      students: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      lessons: {
        include: {
          contents: {
            include: {
              quizSettings: {
                include: {
                  categorySelections: true,
                },
              },
              poll: {
                include: {
                  questions: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      liveSessions: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  return {
    ...course,
    enrolledStudents: course.students.map((cs) => ({
      id: cs.student.id,
      name: cs.student.name,
      email: cs.student.email,
      avatar: cs.student.avatar,
      enrolledAt: cs.enrolledAt.toISOString(),
      progress: cs.progress,
    })),
    teachers: course.teachers.map((ct) => ({
      id: ct.teacher.id,
      name: ct.teacher.name,
      email: ct.teacher.email,
      avatar: ct.teacher.avatar,
      roles: {
        liveTeaching: ct.liveTeaching,
        grading: ct.grading,
        webboard: ct.webboard,
      },
      addedAt: ct.addedAt.toISOString(),
    })),
  };
};

export const createCourse = async (
  data: {
    title: string;
    description: string;
    category: string;
    categoryId?: string;
    level: string;
    courseType: string;
    livePlatform?: string;
    instructorId: string;
    duration: number;
    price: number;
    status: string;
    startDate?: string;
    endDate?: string;
    thumbnail?: string;
  },
  user: AuthUser
) => {
  // Validate
  if (!data.title || !data.description || !data.category || !data.instructorId) {
    throw new Error('ข้อมูลไม่ครบถ้วน');
  }

  // School Admin must have schoolId
  if (user.role === 'SCHOOL_ADMIN' && !user.schoolId) {
    throw new Error('ไม่พบข้อมูลโรงเรียน');
  }

  // Check if instructor exists
  const instructor = await prisma.user.findUnique({
    where: { id: data.instructorId },
  });

  if (!instructor) {
    throw new Error('ไม่พบครูผู้สอน');
  }

  // Create course
  const course = await prisma.course.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      categoryId: data.categoryId || null,
      level: data.level.toUpperCase() as any,
      courseType: data.courseType.toUpperCase() as any,
      livePlatform: data.livePlatform ? (data.livePlatform === 'zoom' ? 'ZOOM' : 'GOOGLE_MEET') as any : null,
      instructorId: data.instructorId,
      schoolId: user.schoolId!,
      duration: data.duration,
      price: data.price,
      status: data.status.toUpperCase() as any,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      thumbnail: data.thumbnail || null,
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    ...course,
    students: 0,
    enrolledStudents: [],
    teachers: [],
  };
};

export const updateCourse = async (
  courseId: string,
  data: {
    title?: string;
    description?: string;
    category?: string;
    categoryId?: string;
    level?: string;
    courseType?: string;
    livePlatform?: string;
    instructorId?: string;
    duration?: number;
    price?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    thumbnail?: string;
  },
  user: AuthUser
) => {
  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์แก้ไขหลักสูตรนี้');
  }

  // Validate required fields if provided
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error('กรุณากรอกชื่อหลักสูตร');
  }

  if (data.description !== undefined && !data.description.trim()) {
    throw new Error('กรุณากรอกคำอธิบายหลักสูตร');
  }

  // Check instructor if provided
  if (data.instructorId) {
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId },
    });

    if (!instructor) {
      throw new Error('ไม่พบครูผู้สอน');
    }
  }

  // Prepare update data
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
  if (data.level !== undefined) updateData.level = data.level.toUpperCase() as any;
  if (data.courseType !== undefined) updateData.courseType = data.courseType.toUpperCase() as any;
  if (data.livePlatform !== undefined) {
    updateData.livePlatform = data.livePlatform
      ? (data.livePlatform === 'zoom' ? 'ZOOM' : 'GOOGLE_MEET')
      : null;
  }
  if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.status !== undefined) updateData.status = data.status.toUpperCase() as any;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail || null;

  // Update course
  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: updateData,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    ...updatedCourse,
    students: course.students || 0,
    enrolledStudents: [],
    teachers: [],
  };
};
