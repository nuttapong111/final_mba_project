// Utility Functions

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Normalize role from API format (SCHOOL_ADMIN) to frontend format (school_admin)
export function normalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'super_admin',
    'SCHOOL_ADMIN': 'school_admin',
    'TEACHER': 'teacher',
    'STUDENT': 'student',
    'PARENT': 'parent',
  };
  return roleMap[role] || role.toLowerCase();
}

export function getRoleLabel(role: string): string {
  // Normalize role to handle both API format (SCHOOL_ADMIN) and frontend format (school_admin)
  const normalizedRole = role.toLowerCase();
  
  const labels: Record<string, string> = {
    super_admin: 'ผู้ดูแลระบบ',
    superadmin: 'ผู้ดูแลระบบ',
    school_admin: 'ผู้ดูแลสถาบัน',
    schooladmin: 'ผู้ดูแลสถาบัน',
    teacher: 'ครู/อาจารย์',
    student: 'นักเรียน',
    parent: 'ผู้ปกครอง',
  };
  
  // Try exact match first
  if (labels[normalizedRole]) {
    return labels[normalizedRole];
  }
  
  // Try with underscore
  const withUnderscore = normalizedRole.replace('_', '_');
  if (labels[withUnderscore]) {
    return labels[withUnderscore];
  }
  
  // Try uppercase format from API
  const upperRole = role.toUpperCase();
  if (upperRole === 'SCHOOL_ADMIN') return 'ผู้ดูแลสถาบัน';
  if (upperRole === 'SUPER_ADMIN') return 'ผู้ดูแลระบบ';
  if (upperRole === 'TEACHER') return 'ครู/อาจารย์';
  if (upperRole === 'STUDENT') return 'นักเรียน';
  
  return role;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    active: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Data filtering utilities based on user role and schoolId
import { User, Course } from './mockData';

/**
 * Filter courses based on user role and schoolId
 * - super_admin: sees all courses
 * - school_admin: sees only courses from their school
 * - teacher: sees only courses they are assigned to (instructorId or in teachers array)
 * - student: sees only courses they are enrolled in
 */
export function filterCoursesByRole(
  courses: Course[],
  user: User | null
): Course[] {
  if (!user) return [];

  // Super admin sees all courses
  if (user.role === 'super_admin') {
    return courses;
  }

  // School admin sees only courses from their school
  if (user.role === 'school_admin' && user.schoolId) {
    return courses.filter((course) => course.schoolId === user.schoolId);
  }

  // Teacher sees only courses they are assigned to
  if (user.role === 'teacher') {
    return courses.filter((course) => {
      // Check if user is the main instructor
      if (course.instructorId === user.id) return true;
      // Check if user is in the teachers array
      if (course.teachers?.some((teacher) => teacher.id === user.id)) return true;
      return false;
    });
  }

  // Student sees only courses they are enrolled in
  if (user.role === 'student') {
    return courses.filter((course) => {
      return course.enrolledStudents?.some((student) => student.id === user.id);
    });
  }

  return [];
}

/**
 * Filter users based on user role and schoolId
 * - super_admin: sees all users
 * - school_admin: sees only users from their school (regardless of courses)
 * - teacher: sees only students from courses they teach
 * - student: sees only teachers from courses they are enrolled in
 */
export function filterUsersByRole(
  users: User[],
  currentUser: User | null,
  courses?: Course[]
): User[] {
  if (!currentUser) return [];

  // Super admin sees all users
  if (currentUser.role === 'super_admin') {
    return users;
  }

  // School admin sees only users from their school (no need for courses filter)
  if (currentUser.role === 'school_admin' && currentUser.schoolId) {
    return users.filter((user) => user.schoolId === currentUser.schoolId);
  }

  // Teacher sees students from courses they teach
  if (currentUser.role === 'teacher' && courses) {
    const teacherCourseIds = courses
      .filter((course) => {
        return (
          course.instructorId === currentUser.id ||
          course.teachers?.some((teacher) => teacher.id === currentUser.id)
        );
      })
      .map((course) => course.id);

    const studentIds = new Set<string>();
    courses.forEach((course) => {
      if (teacherCourseIds.includes(course.id)) {
        course.enrolledStudents?.forEach((student) => {
          studentIds.add(student.id);
        });
      }
    });

    return users.filter((user) => studentIds.has(user.id));
  }

  // Student sees teachers from courses they are enrolled in
  if (currentUser.role === 'student' && courses) {
    const enrolledCourseIds = courses
      .filter((course) =>
        course.enrolledStudents?.some((student) => student.id === currentUser.id)
      )
      .map((course) => course.id);

    const teacherIds = new Set<string>();
    courses.forEach((course) => {
      if (enrolledCourseIds.includes(course.id)) {
        if (course.instructorId) teacherIds.add(course.instructorId);
        course.teachers?.forEach((teacher) => {
          teacherIds.add(teacher.id);
        });
      }
    });

    return users.filter((user) => teacherIds.has(user.id));
  }

  return [];
}

