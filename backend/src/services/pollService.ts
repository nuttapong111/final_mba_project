import prisma from '../config/database';
import { AuthUser } from '../middleware/auth';

export const getPollsByCourse = async (courseId: string, user: AuthUser) => {
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

  // Get all polls for this course (not just those connected to LessonContent)
  const allPolls = await prisma.poll.findMany({
    where: { courseId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get polls that are connected to LessonContent (for lessonTitle and contentId)
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    include: {
      contents: {
        where: {
          type: 'POLL',
        },
        include: {
          poll: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Create a map of pollId -> content info
  const pollContentMap = new Map<string, { lessonTitle: string; lessonId: string; contentId: string; contentTitle: string }>();
  lessons.forEach((lesson) => {
    lesson.contents.forEach((content) => {
      if (content.pollId) {
        pollContentMap.set(content.pollId, {
          lessonTitle: lesson.title,
          lessonId: lesson.id,
          contentId: content.id,
          contentTitle: content.title,
        });
      }
    });
  });

  // Map all polls to the response format
  const polls: Array<{
    id: string;
    title: string;
    lessonTitle: string;
    lessonId: string;
    contentId: string;
    poll: any;
  }> = allPolls.map((poll) => {
    const contentInfo = pollContentMap.get(poll.id);
    return {
      id: poll.id, // Use poll.id instead of content.id so we can identify polls not yet connected
      title: contentInfo?.contentTitle || poll.title,
      lessonTitle: contentInfo?.lessonTitle || 'ยังไม่ได้เชื่อมกับบทเรียน',
      lessonId: contentInfo?.lessonId || '',
      contentId: contentInfo?.contentId || '',
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        questions: poll.questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type.toLowerCase(),
          required: q.required,
          options: q.options,
          order: q.order,
        })),
        createdAt: poll.createdAt.toISOString(),
        updatedAt: poll.updatedAt.toISOString(),
      },
    };
  });

  return polls;
};

export const createPoll = async (
  courseId: string,
  data: {
    title: string;
    description?: string;
    questions: Array<{
      question: string;
      type: string;
      required: boolean;
      options?: string[];
      order: number;
    }>;
  },
  user: AuthUser
) => {
  // Verify course exists and user has permission
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('ไม่พบหลักสูตร');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์สร้างแบบประเมินในหลักสูตรนี้');
  }

  if (!data.title || !data.title.trim()) {
    throw new Error('กรุณากรอกชื่อแบบประเมิน');
  }

  if (!data.questions || data.questions.length === 0) {
    throw new Error('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ');
  }

  // Create poll
  const poll = await prisma.poll.create({
    data: {
      courseId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      questions: {
        create: data.questions.map((q) => ({
          question: q.question.trim(),
          type: q.type.toUpperCase() as any,
          required: q.required,
          options: q.options || [],
          order: q.order,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return poll;
};

export const updatePoll = async (
  pollId: string,
  data: {
    title?: string;
    description?: string;
    questions?: Array<{
      id?: string;
      question: string;
      type: string;
      required: boolean;
      options?: string[];
      order: number;
    }>;
  },
  user: AuthUser
) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { course: true },
  });

  if (!poll) {
    throw new Error('ไม่พบแบบประเมิน');
  }

  if (!poll.course) {
    throw new Error('ไม่พบหลักสูตรที่เกี่ยวข้อง');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && poll.course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์แก้ไขแบบประเมินนี้');
  }

  // Update poll
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;

  // Update questions if provided
  if (data.questions) {
    // Delete existing questions
    await prisma.pollQuestion.deleteMany({
      where: { pollId },
    });

    // Create new questions
    updateData.questions = {
      create: data.questions.map((q) => ({
        question: q.question.trim(),
        type: q.type.toUpperCase() as any,
        required: q.required,
        options: q.options || [],
        order: q.order,
      })),
    };
  }

  const updatedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: updateData,
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return updatedPoll;
};

export const deletePoll = async (pollId: string, user: AuthUser) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { course: true },
  });

  if (!poll) {
    throw new Error('ไม่พบแบบประเมิน');
  }

  if (!poll.course) {
    throw new Error('ไม่พบหลักสูตรที่เกี่ยวข้อง');
  }

  // Check permission
  if (user.role === 'SCHOOL_ADMIN' && poll.course.schoolId !== user.schoolId) {
    throw new Error('ไม่มีสิทธิ์ลบแบบประเมินนี้');
  }

  // Check if poll is used in any content
  const contentUsingPoll = await prisma.lessonContent.findFirst({
    where: {
      poll: {
        id: pollId,
      },
    },
  });

  if (contentUsingPoll) {
    throw new Error('ไม่สามารถลบแบบประเมินที่ถูกใช้งานในเนื้อหาหลักสูตรได้');
  }

  await prisma.poll.delete({
    where: { id: pollId },
  });

  return { message: 'ลบแบบประเมินสำเร็จ' };
};

