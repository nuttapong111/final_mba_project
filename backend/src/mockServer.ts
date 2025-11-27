// Mock API Server for Testing (without database)
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateToken } from './utils/jwt';
import { verify } from 'jsonwebtoken';
import { env } from './config/env';

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'admin@example.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://ui-avatars.com/api/?name=Admin',
  },
  {
    id: '2',
    name: 'School Admin',
    email: 'school@example.com',
    role: 'SCHOOL_ADMIN',
    schoolId: 'school-1',
    avatar: 'https://ui-avatars.com/api/?name=School',
  },
  {
    id: '3',
    name: 'Teacher',
    email: 'teacher@example.com',
    role: 'TEACHER',
    schoolId: 'school-1',
    avatar: 'https://ui-avatars.com/api/?name=Teacher',
  },
  {
    id: '4',
    name: 'Student',
    email: 'student@example.com',
    role: 'STUDENT',
    schoolId: 'school-1',
    avatar: 'https://ui-avatars.com/api/?name=Student',
  },
];

const mockCourses = [
  {
    id: '1',
    title: 'คณิตศาสตร์ ม.4',
    description: 'หลักสูตรคณิตศาสตร์ระดับมัธยมศึกษาปีที่ 4',
    category: 'คณิตศาสตร์',
    level: 'BEGINNER',
    courseType: 'VIDEO',
    instructor: { id: '3', name: 'Teacher', avatar: '' },
    school: { id: 'school-1', name: 'โรงเรียน ABC' },
    teachers: [],
    enrolledStudents: [],
    students: 10,
    rating: 4.5,
    price: 0,
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'คณิตศาสตร์ ม.4 ภาคตัดกรวย',
    description: 'วงกลม วงรี พาลาโบล่า ไฮเพอร์โบล่า',
    category: 'คณิตศาสตร์',
    level: 'INTERMEDIATE',
    courseType: 'VIDEO',
    instructor: { id: '3', name: 'Teacher', avatar: '' },
    school: { id: 'school-1', name: 'โรงเรียน ABC' },
    teachers: [],
    enrolledStudents: [],
    students: 5,
    rating: 4.0,
    price: 4990,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock lessons storage (in-memory)
let mockLessons: Array<{
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  contents: Array<{
    id: string;
    type: string;
    title: string;
    url?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    order: number;
    quizSettings?: any;
    poll?: any;
  }>;
}> = [];

// Health check
app.get('/health', (c) => {
  return c.json({ success: true, message: 'Mock API Server is running' });
});

// Auth routes
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  
  const user = mockUsers.find(u => u.email === email);
  if (!user || password !== 'password123') {
    return c.json({ success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, 400);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    schoolId: (user as any).schoolId,
  });

  return c.json({
    success: true,
    data: {
      user,
      token,
    },
  });
});

app.post('/api/auth/register', async (c) => {
  const data = await c.req.json();
  
  const existing = mockUsers.find(u => u.email === data.email);
  if (existing) {
    return c.json({ success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' }, 400);
  }

  const newUser = {
    id: String(mockUsers.length + 1),
    name: data.name,
    email: data.email,
    role: data.role,
    schoolId: data.schoolId,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`,
  };

  mockUsers.push(newUser);

  return c.json({ success: true, data: newUser });
});

app.get('/api/auth/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Decode and verify JWT token
    const token = authHeader.substring(7);
    const decoded = verify(token, env.JWT_SECRET) as any;
    
    // Find user by ID from token
    const user = mockUsers.find(u => u.id === decoded.id);
    
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
});

// Courses routes
app.get('/api/courses', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ success: true, data: mockCourses });
});

app.post('/api/courses', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const data = await c.req.json();

    // Validate
    if (!data.title || !data.description || !data.category || !data.instructorId) {
      return c.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, 400);
    }

    // Find instructor
    const instructor = mockUsers.find(u => u.id === data.instructorId);
    if (!instructor) {
      return c.json({ success: false, error: 'ไม่พบครูผู้สอน' }, 400);
    }

    // Create new course
    const newCourse = {
      id: String(mockCourses.length + 1),
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail || null,
      category: data.category,
      level: data.level,
      courseType: data.courseType,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        avatar: instructor.avatar,
      },
      school: {
        id: instructor.schoolId || '1',
        name: 'โรงเรียนตัวอย่าง',
      },
      teachers: [],
      enrolledStudents: [],
      students: 0,
      rating: 0,
      price: data.price || 0,
      status: data.status || 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCourses.push(newCourse);

    return c.json({ success: true, data: newCourse });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.get('/api/courses/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = c.req.param('id');
  const course = mockCourses.find(c => c.id === id);
  
  if (!course) {
    return c.json({ success: false, error: 'ไม่พบหลักสูตร' }, 404);
  }

  // Include lessons and contents in response
  const courseWithLessons = {
    ...course,
    lessons: mockLessons.filter(l => l.courseId === id).map(lesson => ({
      ...lesson,
      contents: lesson.contents || [],
    })),
  };

  return c.json({ success: true, data: courseWithLessons });
});

app.put('/api/courses/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const data = await c.req.json();

    const courseIndex = mockCourses.findIndex(c => c.id === id);
    if (courseIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบหลักสูตร' }, 404);
    }

    // Update course
    mockCourses[courseIndex] = {
      ...mockCourses[courseIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return c.json({ success: true, data: mockCourses[courseIndex] });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.put('/api/courses/:id/content', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const { lessons } = await c.req.json();

    if (!Array.isArray(lessons)) {
      return c.json({ success: false, error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    }

    // Verify course exists
    const course = mockCourses.find(c => c.id === id);
    if (!course) {
      return c.json({ success: false, error: 'ไม่พบหลักสูตร' }, 404);
    }

    // Remove existing lessons for this course
    mockLessons = mockLessons.filter(l => l.courseId !== id);

    // Add new lessons
    lessons.forEach((lessonData: any, index: number) => {
      const lesson = {
        id: `lesson-${id}-${index}-${Date.now()}`,
        courseId: id,
        title: lessonData.title,
        description: lessonData.description || '',
        order: lessonData.order || index + 1,
        contents: (lessonData.contents || []).map((contentData: any, contentIndex: number) => {
          // Find poll if pollId is provided
          let pollData = null;
          if (contentData.pollId) {
            const foundPoll = mockPolls.find(p => p.id === contentData.pollId);
            if (foundPoll) {
              pollData = {
                id: foundPoll.id,
                title: foundPoll.title,
                description: foundPoll.description,
                questions: foundPoll.questions,
                createdAt: foundPoll.createdAt,
                updatedAt: foundPoll.updatedAt,
              };
            }
          }

          return {
            id: `content-${id}-${index}-${contentIndex}-${Date.now()}`,
            type: contentData.type,
            title: contentData.title,
            url: contentData.url || null,
            fileUrl: contentData.fileUrl || null,
            fileName: contentData.fileName || null,
            fileSize: contentData.fileSize || null,
            duration: contentData.duration || null,
            order: contentData.order || contentIndex + 1,
            quizSettings: contentData.quizSettings || null,
            poll: pollData,
          };
        }),
      };
      mockLessons.push(lesson);
    });

    return c.json({ success: true, message: 'บันทึกเนื้อหาหลักสูตรสำเร็จ' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

// Users routes
app.get('/api/users', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ success: true, data: mockUsers });
});

app.post('/api/users', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const { name, email, password, role, schoolId } = await c.req.json();

    // Validate
    if (!name || !email || !password || !role) {
      return c.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, 400);
    }

    // Check if email exists
    const existing = mockUsers.find(u => u.email === email);
    if (existing) {
      return c.json({ success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' }, 400);
    }

    // Create new user
    const newUser = {
      id: String(mockUsers.length + 1),
      name,
      email,
      role: role.toUpperCase(),
      schoolId: schoolId || null,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    return c.json({ success: true, data: newUser });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

// Course Categories routes
let mockCourseCategories: Array<{
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}> = [
  {
    id: '1',
    name: 'คณิตศาสตร์',
    description: 'หลักสูตรคณิตศาสตร์',
    schoolId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'ภาษาอังกฤษ',
    description: 'หลักสูตรภาษาอังกฤษ',
    schoolId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

app.get('/api/course-categories', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // In mock server, return all categories (filtering by schoolId should be done in real API)
  return c.json({ success: true, data: mockCourseCategories });
});

app.post('/api/course-categories', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const { name, description } = await c.req.json();

    if (!name || !name.trim()) {
      return c.json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' }, 400);
    }

    // Check if exists
    const existing = mockCourseCategories.find(
      cat => cat.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return c.json({ success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, 400);
    }

    const newCategory = {
      id: String(mockCourseCategories.length + 1),
      name: name.trim(),
      description: description?.trim() || null,
      schoolId: '1', // Mock schoolId
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCourseCategories.push(newCategory);

    return c.json({ success: true, data: newCategory });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.put('/api/course-categories/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const { name, description } = await c.req.json();

    const categoryIndex = mockCourseCategories.findIndex(cat => cat.id === id);
    if (categoryIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบหมวดหมู่' }, 404);
    }

    if (!name || !name.trim()) {
      return c.json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' }, 400);
    }

    // Check if new name conflicts
    if (name.trim() !== mockCourseCategories[categoryIndex].name) {
      const existing = mockCourseCategories.find(
        cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return c.json({ success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' }, 400);
      }
    }

    mockCourseCategories[categoryIndex] = {
      ...mockCourseCategories[categoryIndex],
      name: name.trim(),
      description: description?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    return c.json({ success: true, data: mockCourseCategories[categoryIndex] });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.delete('/api/course-categories/:id', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const id = c.req.param('id');
    const categoryIndex = mockCourseCategories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบหมวดหมู่' }, 404);
    }

    mockCourseCategories = mockCourseCategories.filter(cat => cat.id !== id);

    return c.json({ success: true, data: { success: true } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.post('/api/users/bulk-import', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { users } = await c.req.json();
  
  const results = {
    success: users.map((u: any, i: number) => ({
      id: String(mockUsers.length + i + 1),
      name: u.name,
      email: u.email,
      role: u.role,
    })),
    failed: [],
  };

  return c.json({ success: true, data: results });
});

// Live Sessions
app.get('/api/live-sessions', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ success: true, data: [] });
});

// Webboard
app.get('/api/webboard/courses/:courseId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ success: true, data: [] });
});

// Grading
app.get('/api/grading/tasks', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({ success: true, data: [] });
});

// Polls routes
let mockPolls: Array<{
  id: string;
  courseId: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    required: boolean;
    options?: string[];
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}> = [];

app.get('/api/polls/courses/:courseId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const courseId = c.req.param('courseId');
  
  // Get polls from course lessons (from mockLessons)
  const polls: Array<{
    id: string;
    title: string;
    lessonTitle: string;
    lessonId: string;
    contentId: string;
    poll: any;
  }> = [];

  // Get polls from lessons (polls that are added to lesson content)
  mockLessons.forEach((lesson) => {
    if (lesson.courseId === courseId) {
      lesson.contents.forEach((content) => {
        if (content.type === 'poll' && content.poll) {
          polls.push({
            id: content.id,
            title: content.title || content.poll.title,
            lessonTitle: lesson.title,
            lessonId: lesson.id,
            contentId: content.id,
            poll: content.poll,
          });
        }
      });
    }
  });

  // Also get standalone polls (polls created but not yet added to lesson content)
  const standalonePolls = mockPolls.filter(p => p.courseId === courseId);
  standalonePolls.forEach((poll) => {
    // Check if this poll is already in the list (from lessons)
    const exists = polls.some(p => p.poll?.id === poll.id);
    if (!exists) {
      polls.push({
        id: poll.id,
        title: poll.title,
        lessonTitle: 'ยังไม่ได้เพิ่มในบทเรียน',
        lessonId: '',
        contentId: '',
        poll: {
          id: poll.id,
          title: poll.title,
          description: poll.description,
          questions: poll.questions,
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt,
        },
      });
    }
  });

  return c.json({ success: true, data: polls });
});

app.post('/api/polls/courses/:courseId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const courseId = c.req.param('courseId');
    const data = await c.req.json();

    if (!data.title || !data.title.trim()) {
      return c.json({ success: false, error: 'กรุณากรอกชื่อแบบประเมิน' }, 400);
    }

    if (!data.questions || data.questions.length === 0) {
      return c.json({ success: false, error: 'กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ' }, 400);
    }

    const newPoll = {
      id: `poll-${Date.now()}`,
      courseId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      questions: (data.questions || []).map((q: any, index: number) => ({
        id: `question-${Date.now()}-${index}`,
        question: q.question.trim(),
        type: q.type,
        required: q.required || false,
        options: q.options || [],
        order: q.order || index + 1,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPolls.push(newPoll);

    return c.json({ success: true, data: newPoll });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.put('/api/polls/:pollId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const pollId = c.req.param('pollId');
    const data = await c.req.json();

    const pollIndex = mockPolls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบแบบประเมิน' }, 404);
    }

    if (data.title !== undefined) mockPolls[pollIndex].title = data.title.trim();
    if (data.description !== undefined) mockPolls[pollIndex].description = data.description?.trim() || null;
    if (data.questions) {
      mockPolls[pollIndex].questions = data.questions.map((q: any, index: number) => ({
        id: q.id || `question-${Date.now()}-${index}`,
        question: q.question.trim(),
        type: q.type,
        required: q.required || false,
        options: q.options || [],
        order: q.order || index + 1,
      }));
    }
    mockPolls[pollIndex].updatedAt = new Date().toISOString();

    return c.json({ success: true, data: mockPolls[pollIndex] });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.delete('/api/polls/:pollId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const pollId = c.req.param('pollId');
    const pollIndex = mockPolls.findIndex(p => p.id === pollId);
    if (pollIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบแบบประเมิน' }, 404);
    }

    mockPolls.splice(pollIndex, 1);

    return c.json({ success: true, data: { message: 'ลบแบบประเมินสำเร็จ' } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

// Dashboard
app.get('/api/dashboard/school', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({
    success: true,
    data: {
      totalStudents: 1250,
      totalCourses: 45,
      totalExams: 120,
      averageScore: 78.5,
      completionRate: 85.2,
      activeUsers: 450,
    },
  });
});

app.get('/api/dashboard/admin', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({
    success: true,
    data: {
      totalSchools: 10,
      totalUsers: 5000,
      totalRevenue: 1250000,
      growthRate: 15,
    },
  });
});

app.get('/api/dashboard/teacher', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({
    success: true,
    data: {
      totalCourses: 5,
      totalStudents: 150,
      totalExams: 12,
      pendingGradingTasks: 8,
    },
  });
});

app.get('/api/dashboard/student', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  return c.json({
    success: true,
    data: {
      totalCourses: 3,
      todaySessions: 2,
      completedCourses: 1,
      certificates: 1,
    },
  });
});

// 404
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Question Banks routes
let mockQuestionBanks: Array<{
  id: string;
  courseId: string;
  name: string;
  description?: string;
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    questionCount: number;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}> = [];

app.get('/api/question-banks/courses/:courseId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const courseId = c.req.param('courseId');
    
    // Verify course exists
    const course = mockCourses.find(c => c.id === courseId);
    if (!course) {
      return c.json({ success: false, error: 'ไม่พบหลักสูตร' }, 404);
    }

    // Get or create question bank
    let questionBank = mockQuestionBanks.find(qb => qb.courseId === courseId);
    if (!questionBank) {
      questionBank = {
        id: `question-bank-${courseId}-${Date.now()}`,
        courseId,
        name: `คลังข้อสอบ - ${course.title}`,
        description: `คลังข้อสอบสำหรับหลักสูตร ${course.title}`,
        categories: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockQuestionBanks.push(questionBank);
    }

    return c.json({ success: true, data: questionBank });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.post('/api/question-banks/:questionBankId/categories', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const questionBankId = c.req.param('questionBankId');
    const data = await c.req.json();

    if (!data.name || !data.name.trim()) {
      return c.json({ success: false, error: 'กรุณากรอกชื่อหมวดหมู่' }, 400);
    }

    const questionBank = mockQuestionBanks.find(qb => qb.id === questionBankId);
    if (!questionBank) {
      return c.json({ success: false, error: 'ไม่พบคลังข้อสอบ' }, 404);
    }

    // Check if category name already exists
    const existing = questionBank.categories.find(cat => cat.name.toLowerCase() === data.name.trim().toLowerCase());
    if (existing) {
      return c.json({ success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้วในคลังข้อสอบนี้' }, 400);
    }

    const newCategory = {
      id: `category-${questionBankId}-${Date.now()}`,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      questionCount: 0,
      createdAt: new Date().toISOString(),
    };

    questionBank.categories.push(newCategory);
    questionBank.updatedAt = new Date().toISOString();

    return c.json({ success: true, data: newCategory });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.put('/api/question-banks/categories/:categoryId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const categoryId = c.req.param('categoryId');
    const data = await c.req.json();

    // Find category in question banks
    let foundCategory: any = null;
    let foundQuestionBank: any = null;

    for (const qb of mockQuestionBanks) {
      const category = qb.categories.find(cat => cat.id === categoryId);
      if (category) {
        foundCategory = category;
        foundQuestionBank = qb;
        break;
      }
    }

    if (!foundCategory || !foundQuestionBank) {
      return c.json({ success: false, error: 'ไม่พบหมวดหมู่' }, 404);
    }

    if (data.name && data.name.trim() && data.name.trim() !== foundCategory.name) {
      // Check if new name conflicts
      const existing = foundQuestionBank.categories.find(
        (cat: any) => cat.id !== categoryId && cat.name.toLowerCase() === data.name.trim().toLowerCase()
      );
      if (existing) {
        return c.json({ success: false, error: 'ชื่อหมวดหมู่นี้มีอยู่แล้วในคลังข้อสอบนี้' }, 400);
      }
    }

    if (data.name !== undefined) foundCategory.name = data.name.trim();
    if (data.description !== undefined) foundCategory.description = data.description?.trim() || undefined;
    foundQuestionBank.updatedAt = new Date().toISOString();

    return c.json({ success: true, data: foundCategory });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

app.delete('/api/question-banks/categories/:categoryId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const categoryId = c.req.param('categoryId');

    // Find category in question banks
    let foundQuestionBank: any = null;
    let categoryIndex = -1;

    for (const qb of mockQuestionBanks) {
      const index = qb.categories.findIndex(cat => cat.id === categoryId);
      if (index !== -1) {
        foundQuestionBank = qb;
        categoryIndex = index;
        break;
      }
    }

    if (!foundQuestionBank || categoryIndex === -1) {
      return c.json({ success: false, error: 'ไม่พบหมวดหมู่' }, 404);
    }

    if (foundQuestionBank.categories[categoryIndex].questionCount > 0) {
      return c.json({ success: false, error: 'ไม่สามารถลบหมวดหมู่ที่มีข้อสอบอยู่ได้' }, 400);
    }

    foundQuestionBank.categories.splice(categoryIndex, 1);
    foundQuestionBank.updatedAt = new Date().toISOString();

    return c.json({ success: true, data: { message: 'ลบหมวดหมู่สำเร็จ' } });
  } catch (error: any) {
    return c.json({ success: false, error: error.message || 'เกิดข้อผิดพลาด' }, 400);
  }
});

const port = 3001;

console.log(`🚀 Mock API Server is running on http://localhost:${port}`);
console.log(`📝 Test with: curl http://localhost:${port}/health`);

serve({
  fetch: app.fetch,
  port,
});

