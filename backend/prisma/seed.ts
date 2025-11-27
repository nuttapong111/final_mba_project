import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create School
  const school = await prisma.school.upsert({
    where: { domain: 'school-abc.com' },
    update: {},
    create: {
      name: 'โรงเรียนกวดวิชา ABC',
      domain: 'school-abc.com',
      primaryColor: '#3b82f6',
      subscription: 'PREMIUM',
    },
  });

  console.log('✅ School created:', school.name);

  // Create Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: await hashPassword('password123'),
      role: 'SUPER_ADMIN',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
    },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'school@example.com' },
    update: {},
    create: {
      name: 'สมชาย ใจดี',
      email: 'school@example.com',
      password: await hashPassword('password123'),
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
      avatar: 'https://ui-avatars.com/api/?name=สมชาย+ใจดี&background=3b82f6&color=fff',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      name: 'สมศรี ใจดี',
      email: 'teacher@example.com',
      password: await hashPassword('password123'),
      role: 'TEACHER',
      schoolId: school.id,
      avatar: 'https://ui-avatars.com/api/?name=สมศรี+ใจดี&background=8b5cf6&color=fff',
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      name: 'นักเรียน ดีใจ',
      email: 'student1@example.com',
      password: await hashPassword('password123'),
      role: 'STUDENT',
      schoolId: school.id,
      avatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      name: 'นักเรียน สมชาย',
      email: 'student2@example.com',
      password: await hashPassword('password123'),
      role: 'STUDENT',
      schoolId: school.id,
      avatar: 'https://ui-avatars.com/api/?name=สมชาย&background=3b82f6&color=fff',
    },
  });

  console.log('✅ Users created');

  // Create Course (skip if exists)
  let course = await prisma.course.findFirst({
    where: {
      title: 'คณิตศาสตร์ ม.4',
      schoolId: school.id,
    },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: 'คณิตศาสตร์ ม.4',
        description: 'หลักสูตรคณิตศาสตร์ระดับมัธยมศึกษาปีที่ 4 ครอบคลุมเนื้อหาทั้งหมด',
        thumbnail: 'https://via.placeholder.com/400x300',
        category: 'คณิตศาสตร์',
        level: 'BEGINNER',
        courseType: 'VIDEO',
        livePlatform: 'ZOOM',
        instructorId: teacher.id,
        schoolId: school.id,
        duration: 40,
        price: 0,
        status: 'PUBLISHED',
      },
    });
  }

  console.log('✅ Course created:', course.title);

  // Add students to course (use upsert to avoid duplicates)
  await prisma.courseStudent.upsert({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      studentId: student1.id,
      progress: 65,
    },
  });

  await prisma.courseStudent.upsert({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      studentId: student2.id,
      progress: 45,
    },
  });

  console.log('✅ Students enrolled in course');

  // Add teacher to course with roles (use upsert to avoid duplicates)
  await prisma.courseTeacher.upsert({
    where: {
      courseId_teacherId: {
        courseId: course.id,
        teacherId: teacher.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      teacherId: teacher.id,
      liveTeaching: true,
      grading: true,
      webboard: true,
    },
  });

  console.log('✅ Teacher assigned to course');

  // Create Live Session (skip if exists)
  const existingLiveSession = await prisma.liveSession.findFirst({
    where: {
      courseId: course.id,
      meetingId: '123456789',
    },
  });

  if (!existingLiveSession) {
    await prisma.liveSession.create({
      data: {
        courseId: course.id,
        date: new Date('2024-12-01'),
        startTime: '09:00',
        endTime: '10:00',
        meetingLink: 'https://zoom.us/j/123456789',
        meetingId: '123456789',
        meetingPassword: 'abc123',
        status: 'SCHEDULED',
      },
    });
  }

  console.log('✅ Live session created');

  // Create Question Bank (skip if exists)
  let questionBank = await prisma.questionBank.findFirst({
    where: {
      courseId: course.id,
      name: 'คลังข้อสอบคณิตศาสตร์ ม.4',
    },
  });

  if (!questionBank) {
    questionBank = await prisma.questionBank.create({
      data: {
        courseId: course.id,
        name: 'คลังข้อสอบคณิตศาสตร์ ม.4',
        description: 'ข้อสอบคณิตศาสตร์สำหรับระดับมัธยมศึกษาปีที่ 4',
      },
    });
  }

  // Create Question Category (skip if exists)
  let category = await prisma.questionCategory.findFirst({
    where: {
      questionBankId: questionBank.id,
      name: 'พีชคณิต',
    },
  });

  if (!category) {
    category = await prisma.questionCategory.create({
      data: {
        questionBankId: questionBank.id,
        name: 'พีชคณิต',
        description: 'ข้อสอบเกี่ยวกับพีชคณิต',
      },
    });
  }

  // Create Questions (skip if exists)
  let question1 = await prisma.question.findFirst({
    where: {
      questionBankId: questionBank.id,
      question: 'ถ้า x + 5 = 10 แล้ว x มีค่าเท่าไร?',
    },
  });

  if (!question1) {
    question1 = await prisma.question.create({
      data: {
        questionBankId: questionBank.id,
        categoryId: category.id,
        question: 'ถ้า x + 5 = 10 แล้ว x มีค่าเท่าไร?',
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        points: 1,
        explanation: 'x = 10 - 5 = 5',
        options: {
          create: [
            { text: '5', isCorrect: true, order: 1 },
            { text: '10', isCorrect: false, order: 2 },
            { text: '15', isCorrect: false, order: 3 },
            { text: '20', isCorrect: false, order: 4 },
          ],
        },
      },
    });
  }

  let question2 = await prisma.question.findFirst({
    where: {
      questionBankId: questionBank.id,
      question: 'ผลคูณของ (x + 2)(x - 3) เท่ากับเท่าไร?',
    },
  });

  if (!question2) {
    question2 = await prisma.question.create({
      data: {
        questionBankId: questionBank.id,
        categoryId: category.id,
        question: 'ผลคูณของ (x + 2)(x - 3) เท่ากับเท่าไร?',
        type: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        points: 2,
        explanation: 'ใช้สูตร (a+b)(c+d) = ac + ad + bc + bd',
        options: {
          create: [
            { text: 'x² - x - 6', isCorrect: true, order: 1 },
            { text: 'x² + x - 6', isCorrect: false, order: 2 },
            { text: 'x² - 5x + 6', isCorrect: false, order: 3 },
            { text: 'x² + 5x - 6', isCorrect: false, order: 4 },
          ],
        },
      },
    });
  }

  console.log('✅ Questions created');

  // Create Webboard Post (skip if exists)
  const existingPost = await prisma.webboardPost.findFirst({
    where: {
      courseId: course.id,
      studentId: student1.id,
      question: 'อาจารย์ครับ ไม่เข้าใจเรื่องการแก้สมการกำลังสอง ช่วยอธิบายให้หน่อยได้ไหมครับ?',
    },
  });

  if (!existingPost) {
    await prisma.webboardPost.create({
      data: {
        courseId: course.id,
        studentId: student1.id,
        question: 'อาจารย์ครับ ไม่เข้าใจเรื่องการแก้สมการกำลังสอง ช่วยอธิบายให้หน่อยได้ไหมครับ?',
      },
    });
  }

  console.log('✅ Webboard post created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


