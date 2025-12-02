// Mock Data for Development

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  avatar?: string;
  schoolId?: string;
}

export interface School {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  domain: string;
  subscription: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
}

export interface PollQuestion {
  id: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'checkbox';
  question: string;
  required: boolean;
  options?: string[]; // For multiple_choice and checkbox
  minRating?: number; // For rating (e.g., 1-5)
  maxRating?: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  questions: PollQuestion[];
  createdAt: string;
}

export interface QuizSettings {
  totalQuestions?: number; // จำนวนข้อทั้งหมด
  categorySelections?: ExamQuestionSelection[]; // เลือกข้อแต่ละหมวดมากี่ข้อ
  duration?: number; // เวลาในการทำแบบทดสอบ (นาที)
  maxAttempts?: number; // จำนวนครั้งที่สามารถสอบซ้ำได้ (0 = ไม่จำกัด)
  timeRestriction?: 'always' | 'scheduled'; // เวลาที่สามารถสอบได้
  startDate?: string; // วันที่เริ่มสอบ (ถ้าเป็น scheduled)
  startTime?: string; // เวลาเริ่มสอบ (ถ้าเป็น scheduled)
  endDate?: string; // วันที่สิ้นสุดสอบ (ถ้าเป็น scheduled)
  endTime?: string; // เวลาสิ้นสุดสอบ (ถ้าเป็น scheduled)
  examType?: 'QUIZ' | 'MIDTERM' | 'FINAL'; // ประเภทข้อสอบ
}

export interface LessonContent {
  id: string;
  type: 'video' | 'document' | 'live_link' | 'quiz' | 'pre_test' | 'poll' | 'assignment';
  title: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number; // in bytes
  duration?: number; // in minutes
  order: number;
  poll?: Poll; // For poll type
  assignment?: any; // For assignment type
  quizSettings?: QuizSettings; // For quiz type
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  contents: LessonContent[];
  createdAt: string;
}

export interface LiveSession {
  id: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetingLink: string;
  meetingId?: string;
  meetingPassword?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  recordingUrl?: string;
  createdAt: string;
}

export interface QuizPassingRequirement {
  quizId: string; // ID ของ quiz/pre_test ใน LessonContent
  quizTitle: string;
  passingPercentage: number; // เปอร์เซ็นต์ที่ต้องผ่าน (0-100)
  required: boolean; // จำเป็นต้องผ่านหรือไม่
}

export interface CourseCompletionRequirements {
  requireProgress: boolean; // ต้องมีเงื่อนไขการเรียน/เข้าเรียนหรือไม่
  minProgressPercentage?: number; // เปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน (คิดจากจำนวน content ทั้งหมด: content ที่ดูจนจบหรือคลิกเข้าไปดู + การสอบที่สอบผ่าน)
  requireAllQuizzes: boolean; // ต้องผ่านทุกบททดสอบหรือไม่
  minQuizPassingPercentage?: number; // เปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ (ถ้าไม่ใช้ requireAllQuizzes)
  quizRequirements?: QuizPassingRequirement[]; // เงื่อนไขการผ่านแต่ละบททดสอบ
}

export interface CourseTeacher {
  id: string; // Teacher user ID
  name: string;
  email: string;
  avatar?: string;
  roles: {
    liveTeaching: boolean; // สอนสด
    grading: boolean; // ตรวจการบ้าน
    webboard: boolean; // มีส่วนร่วมใน webboard
  };
  addedAt: string;
}

export interface CourseStudent {
  id: string; // Student user ID
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: string;
  progress?: number; // เปอร์เซ็นต์ความคืบหน้า
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  courseType: 'video' | 'live';
  livePlatform?: 'zoom' | 'google_meet';
  instructorId: string; // ID of assigned teacher
  schoolId: string; // ID of school that owns this course
  teachers?: CourseTeacher[]; // รายชื่ออาจารย์ที่สอนในหลักสูตร
  enrolledStudents?: CourseStudent[]; // รายชื่อนักเรียนที่ลงทะเบียน
  startDate?: string; // For live courses: YYYY-MM-DD
  endDate?: string; // For live courses: YYYY-MM-DD
  duration: number; // in hours
  students: number;
  rating: number;
  price: number;
  status: 'draft' | 'published' | 'archived';
  lessons?: Lesson[];
  liveSessions?: LiveSession[]; // For live courses
  completionRequirements?: CourseCompletionRequirements; // เงื่อนไขการจบหลักสูตร
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  category: string; // หมวดหมู่ เช่น "พีชคณิต", "เรขาคณิต", "แคลคูลัส"
  difficulty: 'easy' | 'medium' | 'hard';
  points: number; // คะแนนของข้อสอบ
  options?: QuestionOption[]; // สำหรับ multiple_choice และ true_false
  correctAnswer?: string; // สำหรับ short_answer
  explanation?: string; // คำอธิบายคำตอบ
  courseId?: string; // หลักสูตรที่เกี่ยวข้อง (optional)
  createdAt: string;
  updatedAt: string;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  courseId?: string; // หลักสูตรที่เกี่ยวข้อง (optional)
  questionCount: number;
  createdAt: string;
}

export interface QuestionBank {
  id: string;
  name: string;
  description?: string;
  courseId?: string; // ถ้าเป็น null = คลังข้อสอบทั่วไป
  categories: QuestionCategory[];
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestionSelection {
  categoryId: string;
  categoryName: string;
  questionCount: number; // จำนวนข้อที่ต้องการสุ่มจากหมวดหมู่นี้
  difficulty?: 'easy' | 'medium' | 'hard'; // ระดับความยาก (optional)
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  type: 'quiz' | 'midterm' | 'final';
  duration: number; // in minutes
  totalQuestions: number;
  totalScore: number;
  passingScore: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  useRandomQuestions?: boolean; // ใช้การสุ่มข้อสอบหรือไม่
  questionSelections?: ExamQuestionSelection[]; // การเลือกข้อสอบจากหมวดหมู่ต่างๆ
  questionIds?: string[]; // ID ของข้อสอบที่เลือก (ถ้าไม่ใช้การสุ่ม)
}

export interface Analytics {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  averageScore: number;
  completionRate: number;
  activeUsers: number;
}

// Mock Users for Login Testing
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'ผู้ดูแลระบบ',
    email: 'admin@lms.com',
    role: 'super_admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
    // super_admin ไม่มี schoolId เพราะเห็นข้อมูลทั้งหมด
  },
  {
    id: '2',
    name: 'สมชาย ใจดี',
    email: 'school@lms.com',
    role: 'school_admin',
    avatar: 'https://ui-avatars.com/api/?name=สมชาย+ใจดี&background=3b82f6&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
  {
    id: '3',
    name: 'อาจารย์ สมศรี',
    email: 'teacher@lms.com',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
  {
    id: '4',
    name: 'นักเรียน ดีใจ',
    email: 'student@lms.com',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
  {
    id: '5',
    name: 'อาจารย์ วิชัย',
    email: 'teacher2@lms.com',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=วิชัย&background=10b981&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
  {
    id: '6',
    name: 'อาจารย์ สุชาดา',
    email: 'teacher3@lms.com',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=สุชาดา&background=f59e0b&color=fff',
    schoolId: '2', // สถาบัน XYZ
  },
  {
    id: '7',
    name: 'นักเรียน สมชาย',
    email: 'student2@lms.com',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=สมชาย&background=3b82f6&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
  {
    id: '8',
    name: 'นักเรียน สมหญิง',
    email: 'student3@lms.com',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=สมหญิง&background=ec4899&color=fff',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
  },
];

// Mock Login Credentials
export const mockCredentials = {
  'admin@lms.com': { password: 'admin123', role: 'super_admin' as const },
  'school@lms.com': { password: 'school123', role: 'school_admin' as const },
  'teacher@lms.com': { password: 'teacher123', role: 'teacher' as const },
  'student@lms.com': { password: 'student123', role: 'student' as const },
};

// Mock Teachers (for course assignment) - filter from mockUsers
export const mockTeachers: User[] = mockUsers.filter(u => u.role === 'teacher');

// Mock Students (for course enrollment) - filter from mockUsers
export const mockStudents: User[] = mockUsers.filter(u => u.role === 'student');

// Mock Schools
export const mockSchools: School[] = [
  {
    id: '1',
    name: 'โรงเรียนกวดวิชา ABC',
    logo: 'https://via.placeholder.com/150',
    primaryColor: '#3b82f6',
    domain: 'abc-tutoring.com',
    subscription: 'premium',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'สถาบัน XYZ',
    logo: 'https://via.placeholder.com/150',
    primaryColor: '#8b5cf6',
    domain: 'xyz-institute.com',
    subscription: 'basic',
    createdAt: '2024-02-20',
  },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'คณิตศาสตร์ ม.4',
    description: 'หลักสูตรคณิตศาสตร์ระดับมัธยมศึกษาปีที่ 4 ครอบคลุมเนื้อหาทั้งหมด',
    thumbnail: 'https://via.placeholder.com/400x300?text=คณิตศาสตร์',
    instructor: {
      id: '3',
      name: 'อาจารย์ สมศรี',
      avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
    },
    category: 'คณิตศาสตร์',
    level: 'beginner',
    courseType: 'video',
    instructorId: '3',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
    duration: 40,
    students: 150,
    rating: 4.8,
    price: 2990,
    status: 'published',
    completionRequirements: {
      requireProgress: true,
      minProgressPercentage: 100,
      requireAllQuizzes: false,
      minQuizPassingPercentage: 70,
      quizRequirements: [
        {
          quizId: 'pre-test-1',
          quizTitle: 'แบบทดสอบก่อนเรียน',
          passingPercentage: 60,
          required: true,
        },
        {
          quizId: '1-4',
          quizTitle: 'แบบทดสอบหลังเรียน',
          passingPercentage: 70,
          required: true,
        },
      ],
    },
    teachers: [
      {
        id: '3',
        name: 'อาจารย์ สมศรี',
        email: 'teacher@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
        roles: {
          liveTeaching: true,
          grading: true,
          webboard: true,
        },
        addedAt: '2024-01-10',
      },
    ],
    enrolledStudents: [
      {
        id: '4',
        name: 'นักเรียน ดีใจ',
        email: 'student@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
        enrolledAt: '2024-01-12',
        progress: 65,
      },
      {
        id: '7',
        name: 'นักเรียน สมชาย',
        email: 'student2@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=สมชาย&background=3b82f6&color=fff',
        enrolledAt: '2024-01-15',
        progress: 80,
      },
    ],
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    title: 'ภาษาอังกฤษ TOEIC',
    description: 'เตรียมสอบ TOEIC ครบทุกทักษะ พร้อมเทคนิคการทำข้อสอบ',
    thumbnail: 'https://via.placeholder.com/400x300?text=TOEIC',
    instructor: {
      id: '3',
      name: 'อาจารย์ สมศรี',
      avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
    },
    category: 'ภาษาอังกฤษ',
    level: 'intermediate',
    courseType: 'live',
    livePlatform: 'zoom',
    instructorId: '3',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    duration: 60,
    students: 200,
    rating: 4.9,
    price: 3990,
    status: 'published',
    liveSessions: [
      {
        id: '1',
        courseId: '2',
        date: '2024-03-05',
        startTime: '18:00',
        endTime: '20:00',
        meetingLink: 'https://zoom.us/j/123456789',
        meetingId: '123456789',
        status: 'scheduled',
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        courseId: '2',
        date: '2024-03-12',
        startTime: '18:00',
        endTime: '20:00',
        meetingLink: 'https://zoom.us/j/987654321',
        meetingId: '987654321',
        status: 'scheduled',
        createdAt: '2024-01-15',
      },
    ],
    teachers: [
      {
        id: '3',
        name: 'อาจารย์ สมศรี',
        email: 'teacher@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
        roles: {
          liveTeaching: true,
          grading: false,
          webboard: true,
        },
        addedAt: '2024-01-15',
      },
      {
        id: '5',
        name: 'อาจารย์ วิชัย',
        email: 'teacher2@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=วิชัย&background=10b981&color=fff',
        roles: {
          liveTeaching: false,
          grading: true,
          webboard: true,
        },
        addedAt: '2024-01-20',
      },
    ],
    enrolledStudents: [
      {
        id: '4',
        name: 'นักเรียน ดีใจ',
        email: 'student@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
        enrolledAt: '2024-02-01',
        progress: 45,
      },
      {
        id: '8',
        name: 'นักเรียน สมหญิง',
        email: 'student3@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=สมหญิง&background=ec4899&color=fff',
        enrolledAt: '2024-02-05',
        progress: 30,
      },
    ],
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    title: 'ฟิสิกส์ ม.6',
    description: 'สรุปเนื้อหาฟิสิกส์ ม.6 สำหรับเตรียมสอบเข้ามหาวิทยาลัย',
    thumbnail: 'https://via.placeholder.com/400x300?text=ฟิสิกส์',
    instructor: {
      id: '3',
      name: 'อาจารย์ สมศรี',
      avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
    },
    category: 'ฟิสิกส์',
    level: 'advanced',
    courseType: 'video',
    instructorId: '3',
    schoolId: '1', // โรงเรียนกวดวิชา ABC
    duration: 50,
    students: 120,
    rating: 4.7,
    price: 3490,
    status: 'published',
    teachers: [
      {
        id: '3',
        name: 'อาจารย์ สมศรี',
        email: 'teacher@lms.com',
        avatar: 'https://ui-avatars.com/api/?name=สมศรี&background=8b5cf6&color=fff',
        roles: {
          liveTeaching: true,
          grading: true,
          webboard: false,
        },
        addedAt: '2024-02-01',
      },
    ],
    enrolledStudents: [],
    createdAt: '2024-02-01',
  },
];

// Mock Lessons
export const mockLessons: Lesson[] = [
  {
    id: '1',
    courseId: '1',
    title: 'บทที่ 1: พื้นฐานคณิตศาสตร์',
    description: 'เรียนรู้พื้นฐานคณิตศาสตร์',
    order: 1,
    contents: [
      {
        id: '1-1',
        type: 'pre_test',
        title: 'แบบทดสอบก่อนเรียน',
        order: 1,
      },
      {
        id: '1-2',
        type: 'video',
        title: 'วิดีโอการสอน: พื้นฐานคณิตศาสตร์',
        url: 'https://example.com/video1',
        duration: 45,
        order: 2,
      },
      {
        id: '1-3',
        type: 'document',
        title: 'เอกสารประกอบการเรียน',
        fileUrl: 'https://example.com/doc1.pdf',
        order: 3,
      },
      {
        id: '1-4',
        type: 'quiz',
        title: 'แบบทดสอบหลังเรียน',
        order: 4,
      },
    ],
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    courseId: '1',
    title: 'บทที่ 2: พีชคณิต',
    description: 'เรียนรู้พีชคณิต',
    order: 2,
    contents: [
      {
        id: '2-1',
        type: 'video',
        title: 'วิดีโอการสอน: พีชคณิต',
        url: 'https://example.com/video2',
        duration: 60,
        order: 1,
      },
      {
        id: '2-2',
        type: 'live_link',
        title: 'สอนสด: พีชคณิต',
        url: 'https://zoom.us/j/123456',
        order: 2,
      },
    ],
    createdAt: '2024-01-12',
  },
];

// Mock Question Categories
export const mockQuestionCategories: QuestionCategory[] = [
  {
    id: 'cat-1',
    name: 'พีชคณิต',
    description: 'ข้อสอบเกี่ยวกับพีชคณิต',
    courseId: '1',
    questionCount: 25,
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-2',
    name: 'เรขาคณิต',
    description: 'ข้อสอบเกี่ยวกับเรขาคณิต',
    courseId: '1',
    questionCount: 20,
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-3',
    name: 'แคลคูลัส',
    description: 'ข้อสอบเกี่ยวกับแคลคูลัส',
    courseId: '1',
    questionCount: 15,
    createdAt: '2024-01-01',
  },
  {
    id: 'cat-4',
    name: 'สถิติ',
    description: 'ข้อสอบเกี่ยวกับสถิติ',
    courseId: '1',
    questionCount: 10,
    createdAt: '2024-01-01',
  },
];

// Mock Questions
export const mockQuestions: Question[] = [
  {
    id: 'q-1',
    question: 'ถ้า x + 5 = 10 แล้ว x มีค่าเท่าไร?',
    type: 'multiple_choice',
    category: 'cat-1',
    difficulty: 'easy',
    points: 2,
    options: [
      { id: 'opt-1', text: '5', isCorrect: true },
      { id: 'opt-2', text: '10', isCorrect: false },
      { id: 'opt-3', text: '15', isCorrect: false },
      { id: 'opt-4', text: '20', isCorrect: false },
    ],
    explanation: 'x + 5 = 10, ดังนั้น x = 10 - 5 = 5',
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'q-2',
    question: 'ผลคูณของ (x + 2)(x - 3) เท่ากับเท่าไร?',
    type: 'multiple_choice',
    category: 'cat-1',
    difficulty: 'medium',
    points: 3,
    options: [
      { id: 'opt-5', text: 'x² - x - 6', isCorrect: true },
      { id: 'opt-6', text: 'x² + x - 6', isCorrect: false },
      { id: 'opt-7', text: 'x² - 5x + 6', isCorrect: false },
      { id: 'opt-8', text: 'x² + 5x - 6', isCorrect: false },
    ],
    explanation: '(x + 2)(x - 3) = x² - 3x + 2x - 6 = x² - x - 6',
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'q-3',
    question: 'พื้นที่ของสามเหลี่ยมที่มีฐาน 10 cm และสูง 8 cm เท่ากับเท่าไร?',
    type: 'multiple_choice',
    category: 'cat-2',
    difficulty: 'easy',
    points: 2,
    options: [
      { id: 'opt-9', text: '40 cm²', isCorrect: true },
      { id: 'opt-10', text: '80 cm²', isCorrect: false },
      { id: 'opt-11', text: '18 cm²', isCorrect: false },
      { id: 'opt-12', text: '36 cm²', isCorrect: false },
    ],
    explanation: 'พื้นที่สามเหลี่ยม = (1/2) × ฐาน × สูง = (1/2) × 10 × 8 = 40 cm²',
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'q-4',
    question: 'เส้นรอบวงของวงกลมที่มีรัศมี 7 cm เท่ากับเท่าไร? (ใช้ π = 22/7)',
    type: 'multiple_choice',
    category: 'cat-2',
    difficulty: 'medium',
    points: 3,
    options: [
      { id: 'opt-13', text: '44 cm', isCorrect: true },
      { id: 'opt-14', text: '22 cm', isCorrect: false },
      { id: 'opt-15', text: '14 cm', isCorrect: false },
      { id: 'opt-16', text: '49 cm', isCorrect: false },
    ],
    explanation: 'เส้นรอบวง = 2πr = 2 × (22/7) × 7 = 44 cm',
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'q-5',
    question: 'อนุพันธ์ของ f(x) = x² + 3x + 2 คือเท่าไร?',
    type: 'multiple_choice',
    category: 'cat-3',
    difficulty: 'medium',
    points: 3,
    options: [
      { id: 'opt-17', text: '2x + 3', isCorrect: true },
      { id: 'opt-18', text: 'x + 3', isCorrect: false },
      { id: 'opt-19', text: '2x + 2', isCorrect: false },
      { id: 'opt-20', text: 'x² + 3', isCorrect: false },
    ],
    explanation: "f'(x) = d/dx(x²) + d/dx(3x) + d/dx(2) = 2x + 3 + 0 = 2x + 3",
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'q-6',
    question: 'ค่าเฉลี่ยของข้อมูล 5, 7, 9, 11, 13 คือเท่าไร?',
    type: 'multiple_choice',
    category: 'cat-4',
    difficulty: 'easy',
    points: 2,
    options: [
      { id: 'opt-21', text: '9', isCorrect: true },
      { id: 'opt-22', text: '8', isCorrect: false },
      { id: 'opt-23', text: '10', isCorrect: false },
      { id: 'opt-24', text: '11', isCorrect: false },
    ],
    explanation: 'ค่าเฉลี่ย = (5 + 7 + 9 + 11 + 13) / 5 = 45 / 5 = 9',
    courseId: '1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

// Mock Question Bank
export const mockQuestionBank: QuestionBank = {
  id: 'qb-1',
  name: 'คลังข้อสอบ คณิตศาสตร์ ม.4',
  description: 'คลังข้อสอบสำหรับหลักสูตรคณิตศาสตร์ ม.4',
  courseId: '1',
  categories: mockQuestionCategories,
  questions: mockQuestions,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

// Helper function to get questions by category
export const getQuestionsByCategory = (categoryId: string): Question[] => {
  return mockQuestions.filter(q => q.category === categoryId);
};

// Helper function to get random questions from categories
export const getRandomQuestions = (
  selections: ExamQuestionSelection[]
): Question[] => {
  const selectedQuestions: Question[] = [];
  
  selections.forEach(selection => {
    const categoryQuestions = getQuestionsByCategory(selection.categoryId);
    let filteredQuestions = categoryQuestions;
    
    // Filter by difficulty if specified
    if (selection.difficulty) {
      filteredQuestions = filteredQuestions.filter(
        q => q.difficulty === selection.difficulty
      );
    }
    
    // Shuffle and take the required number
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    selectedQuestions.push(...shuffled.slice(0, selection.questionCount));
  });
  
  return selectedQuestions;
};

// Mock Exams
export const mockExams: Exam[] = [
  {
    id: '1',
    title: 'สอบกลางภาค คณิตศาสตร์ ม.4',
    courseId: '1',
    type: 'midterm',
    duration: 90,
    totalQuestions: 30,
    totalScore: 100,
    passingScore: 50,
    startDate: '2024-03-15T09:00:00',
    endDate: '2024-03-15T10:30:00',
    status: 'scheduled',
    useRandomQuestions: true,
    questionSelections: [
      { categoryId: 'cat-1', categoryName: 'พีชคณิต', questionCount: 15 },
      { categoryId: 'cat-2', categoryName: 'เรขาคณิต', questionCount: 10 },
      { categoryId: 'cat-3', categoryName: 'แคลคูลัส', questionCount: 5 },
    ],
  },
  {
    id: '2',
    title: 'แบบทดสอบ TOEIC Practice Test',
    courseId: '2',
    type: 'quiz',
    duration: 120,
    totalQuestions: 100,
    totalScore: 990,
    passingScore: 600,
    startDate: '2024-03-20T10:00:00',
    endDate: '2024-03-20T12:00:00',
    status: 'scheduled',
    useRandomQuestions: false,
  },
];

// Mock Analytics
export const mockAnalytics: Analytics = {
  totalStudents: 1250,
  totalCourses: 45,
  totalExams: 120,
  averageScore: 78.5,
  completionRate: 85.2,
  activeUsers: 890,
};

// Helper Functions
export const getUserByRole = (role: User['role']): User | undefined => {
  return mockUsers.find(user => user.role === role);
};

export const getCoursesByInstructor = (instructorId: string): Course[] => {
  return mockCourses.filter(course => course.instructor.id === instructorId);
};

export const getExamsByCourse = (courseId: string): Exam[] => {
  return mockExams.filter(exam => exam.courseId === courseId);
};

export const getLessonsByCourse = (courseId: string): Lesson[] => {
  return mockLessons.filter(lesson => lesson.courseId === courseId);
};

export const getCourseWithLessons = (courseId: string): Course | undefined => {
  const course = mockCourses.find(c => c.id === courseId);
  if (course) {
    course.lessons = getLessonsByCourse(courseId);
  }
  return course;
};

