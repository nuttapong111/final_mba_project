import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getWebboardPosts = async (courseId: string, user: AuthUser) => {
  // Check if user has access to course
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      ...(user.role === 'SCHOOL_ADMIN' && user.schoolId
        ? { schoolId: user.schoolId }
        : user.role === 'TEACHER'
        ? {
            OR: [
              { instructorId: user.id },
              { teachers: { some: { teacherId: user.id } } },
            ],
          }
        : user.role === 'STUDENT'
        ? { students: { some: { studentId: user.id } } }
        : {}),
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตรหรือไม่มีสิทธิ์');
  }

  const posts = await prisma.webboardPost.findMany({
    where: { courseId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return posts;
};

/**
 * Get all webboard posts for a teacher across all their courses
 */
export const getTeacherWebboardPosts = async (user: AuthUser) => {
  // Get all courses where user is instructor or teacher
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { instructorId: user.id },
        { teachers: { some: { teacherId: user.id } } },
      ],
    },
    select: {
      id: true,
      title: true,
    },
  });

  const courseIds = courses.map((c) => c.id);

  if (courseIds.length === 0) {
    return [];
  }

  const posts = await prisma.webboardPost.findMany({
    where: {
      courseId: { in: courseIds },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return posts;
};

export const createWebboardPost = async (
  courseId: string,
  question: string,
  user: AuthUser
) => {
  if (user.role !== 'STUDENT') {
    throw new Error('เฉพาะนักเรียนเท่านั้นที่สามารถตั้งคำถามได้');
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      students: { some: { studentId: user.id } },
    },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตรหรือไม่ได้ลงทะเบียน');
  }

  const post = await prisma.webboardPost.create({
    data: {
      courseId,
      studentId: user.id,
      question,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      replies: true,
    },
  });

  return post;
};

export const replyToPost = async (
  postId: string,
  content: string,
  user: AuthUser
) => {
  const post = await prisma.webboardPost.findUnique({
    where: { id: postId },
    include: { course: true },
  });

  if (!post) {
    throw new Error('ไม่พบคำถาม');
  }

  // Check if user has access (teacher or student enrolled in course)
  if (user.role === 'STUDENT') {
    const enrolled = await prisma.courseStudent.findUnique({
      where: {
        courseId_studentId: {
          courseId: post.courseId,
          studentId: user.id,
        },
      },
    });

    if (!enrolled) {
      throw new Error('ไม่มีสิทธิ์ตอบคำถาม');
    }
  } else if (user.role === 'TEACHER') {
    const isTeacher = await prisma.courseTeacher.findUnique({
      where: {
        courseId_teacherId: {
          courseId: post.courseId,
          teacherId: user.id,
        },
      },
    });

    if (!isTeacher && post.course.instructorId !== user.id) {
      throw new Error('ไม่มีสิทธิ์ตอบคำถาม');
    }
  } else {
    throw new Error('ไม่มีสิทธิ์ตอบคำถาม');
  }

  const reply = await prisma.webboardReply.create({
    data: {
      postId,
      authorId: user.id,
      content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
        },
      },
    },
  });

  return reply;
};


