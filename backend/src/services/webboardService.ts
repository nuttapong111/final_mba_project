import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';
import { createNotification, createNotificationsForUsers } from './notificationService';

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
    include: {
      instructor: {
        select: { id: true, name: true },
      },
      teachers: {
        select: {
          teacher: {
            select: { id: true, name: true },
          },
        },
      },
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

  // Parse mentions from question
  const { mentions, hasAll } = parseMentions(question);
  const notificationUserIds = new Set<string>();

  // If @all is mentioned, notify all teachers in the course
  if (hasAll) {
    const allCourseUsers = await getCourseUsers(courseId);
    allCourseUsers.forEach((id) => notificationUserIds.add(id));
  } else {
    // Notify teachers by default when student posts
    if (course.instructorId) {
      notificationUserIds.add(course.instructorId);
    }
    course.teachers.forEach((ct) => {
      notificationUserIds.add(ct.teacher.id);
    });

    // Notify mentioned users
    if (mentions.length > 0) {
      const mentionedUserIds = await findUsersByName(mentions, courseId);
      mentionedUserIds.forEach((id) => notificationUserIds.add(id));
    }
  }

  // Remove the author from notifications
  notificationUserIds.delete(user.id);

  // Create notifications
  if (notificationUserIds.size > 0) {
    await createNotificationsForUsers(
      Array.from(notificationUserIds),
      {
        title: 'มีคำถามใหม่ใน Webboard',
        message: `${user.name} ได้ตั้งคำถามในหลักสูตร ${course.title}`,
        type: 'info',
        link: `/student/courses/${courseId}/webboard`,
      }
    );
  }

  return post;
};

export const replyToPost = async (
  postId: string,
  content: string,
  user: AuthUser
) => {
  const post = await prisma.webboardPost.findUnique({
    where: { id: postId },
    include: {
      course: {
        include: {
          instructor: {
            select: { id: true, name: true },
          },
          teachers: {
            select: {
              teacher: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
      student: {
        select: { id: true, name: true },
      },
    },
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

  // Parse mentions from reply content
  const { mentions, hasAll } = parseMentions(content);
  const notificationUserIds = new Set<string>();

  // Always notify the original poster (unless it's the same person)
  if (post.studentId !== user.id) {
    notificationUserIds.add(post.studentId);
  }

  // If @all is mentioned, notify all users in the course
  if (hasAll) {
    const allCourseUsers = await getCourseUsers(post.courseId);
    allCourseUsers.forEach((id) => notificationUserIds.add(id));
  } else {
    // Notify mentioned users
    if (mentions.length > 0) {
      const mentionedUserIds = await findUsersByName(mentions, post.courseId);
      mentionedUserIds.forEach((id) => notificationUserIds.add(id));
    }
  }

  // Remove the author from notifications
  notificationUserIds.delete(user.id);

  // Create notifications
  if (notificationUserIds.size > 0) {
    const isTeacherReply = user.role === 'TEACHER';
    await createNotificationsForUsers(
      Array.from(notificationUserIds),
      {
        title: isTeacherReply 
          ? 'อาจารย์ได้ตอบคำถามของคุณ' 
          : 'มีคำตอบใหม่ใน Webboard',
        message: `${user.name} ได้ตอบคำถามในหลักสูตร ${post.course.title}`,
        type: 'info',
        link: user.role === 'TEACHER' 
          ? `/teacher/webboard`
          : `/student/courses/${post.courseId}/webboard`,
      }
    );
  }

  return reply;
};

/**
 * Parse @mentions from content
 * Returns array of mentioned usernames and whether @all was mentioned
 */
function parseMentions(content: string): { mentions: string[]; hasAll: boolean } {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let hasAll = false;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const mention = match[1].toLowerCase();
    if (mention === 'all') {
      hasAll = true;
    } else {
      mentions.push(mention);
    }
  }

  return { mentions: [...new Set(mentions)], hasAll };
}

/**
 * Get all users in a course (students and teachers)
 */
async function getCourseUsers(courseId: string): Promise<string[]> {
  const [students, teachers, instructor] = await Promise.all([
    prisma.courseStudent.findMany({
      where: { courseId },
      select: { studentId: true },
    }),
    prisma.courseTeacher.findMany({
      where: { courseId },
      select: { teacherId: true },
    }),
    prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    }),
  ]);

  const userIds = new Set<string>();
  
  students.forEach((s) => userIds.add(s.studentId));
  teachers.forEach((t) => userIds.add(t.teacherId));
  if (instructor?.instructorId) {
    userIds.add(instructor.instructorId);
  }

  return Array.from(userIds);
}

/**
 * Find users by name (for @mentions)
 * Supports partial name matching
 */
async function findUsersByName(names: string[], courseId: string): Promise<string[]> {
  if (names.length === 0) return [];

  // Get all users in the course
  const courseUserIds = await getCourseUsers(courseId);
  
  if (courseUserIds.length === 0) return [];

  // Find users by name (try to match any of the mentioned names)
  const users = await prisma.user.findMany({
    where: {
      id: { in: courseUserIds },
      OR: names.map(name => ({
        name: {
          contains: name,
          mode: 'insensitive',
        },
      })),
    },
    select: { id: true },
  });

  return users.map((u) => u.id);
}

/**
 * Get all users in a course for mention autocomplete
 */
export const getCourseUsersForMentions = async (
  courseId: string,
  user: AuthUser
) => {
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

  const [students, teachers, instructor] = await Promise.all([
    prisma.courseStudent.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    }),
    prisma.courseTeacher.findMany({
      where: { courseId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    }),
    course.instructorId
      ? prisma.user.findUnique({
          where: { id: course.instructorId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        })
      : null,
  ]);

  const users: Array<{
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
    role: string;
  }> = [];

  // Add instructor
  if (instructor) {
    users.push(instructor);
  }

  // Add teachers
  teachers.forEach((ct) => {
    if (ct.teacher.id !== course.instructorId) {
      users.push(ct.teacher);
    }
  });

  // Add students
  students.forEach((cs) => {
    users.push(cs.student);
  });

  return users;
};

