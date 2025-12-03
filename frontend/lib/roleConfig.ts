// Role-based Navigation Configuration

import {
  HomeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const roleNavigation: Record<string, NavItem[]> = {
  super_admin: [
    { name: 'แดชบอร์ด', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'จัดการสถาบัน', href: '/admin/schools', icon: BuildingOfficeIcon },
    { name: 'ผู้ใช้งานทั้งหมด', href: '/admin/users', icon: UsersIcon },
    { name: 'รายงานระบบ', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'ตั้งค่าระบบ', href: '/admin/settings', icon: Cog6ToothIcon },
  ],
  school_admin: [
    { name: 'แดชบอร์ด', href: '/school/dashboard', icon: HomeIcon },
    { name: 'หลักสูตร', href: '/school/courses', icon: AcademicCapIcon },
    { name: 'หมวดหมู่หลักสูตร', href: '/school/course-categories', icon: TagIcon },
    { name: 'ผู้ใช้งาน', href: '/users', icon: UsersIcon },
    { name: 'ตั้งค่า', href: '/settings', icon: Cog6ToothIcon },
  ],
  teacher: [
    { name: 'แดชบอร์ด', href: '/teacher/dashboard', icon: HomeIcon },
    { name: 'หลักสูตรของฉัน', href: '/teacher/courses', icon: AcademicCapIcon },
    // { name: 'ห้องเรียนออนไลน์', href: '/teacher/live-class', icon: VideoCameraIcon }, // Phase 2
    { name: 'Webboard', href: '/teacher/webboard', icon: ChatBubbleLeftRightIcon },
    { name: 'ตรวจข้อสอบ', href: '/teacher/grading', icon: ClipboardDocumentCheckIcon },
  ],
  student: [
    { name: 'แดชบอร์ด', href: '/student/dashboard', icon: HomeIcon },
    { name: 'หลักสูตรของฉัน', href: '/student/courses', icon: BookOpenIcon },
    // { name: 'ห้องเรียนออนไลน์', href: '/student/live-class', icon: VideoCameraIcon }, // Phase 2
    { name: 'ใบประกาศนียบัตร', href: '/student/certificates', icon: TrophyIcon },
  ],
};

import { normalizeRole } from './utils';

export const getRoleDashboardPath = (role: string): string => {
  // Normalize role to handle both API format and frontend format
  const normalizedRole = normalizeRole(role);
  
  const paths: Record<string, string> = {
    super_admin: '/admin/dashboard',
    school_admin: '/school/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
  };
  
  return paths[normalizedRole] || '/dashboard';
};

