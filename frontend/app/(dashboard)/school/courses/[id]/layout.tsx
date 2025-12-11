'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, type Course } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  TagIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { cn } from '@/lib/utils';

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is teacher
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'teacher';

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getById(id);
      if (response.success && response.data) {
        setCourse(response.data);
      } else {
        setCourse(null);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบหลักสูตร</p>
        <Button onClick={() => router.push('/school/courses')} className="mt-4">
          กลับไปหน้าหลักสูตร
        </Button>
      </div>
    );
  }

  const handleEdit = () => {
    router.push(`/school/courses/${id}/edit`);
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณต้องการลบหลักสูตรนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      await Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ!',
        text: 'หลักสูตรถูกลบเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
      router.push('/school/courses');
    }
  };

  // Define all tabs
  const allTabs = [
    {
      id: 'content',
      name: 'จัดการเนื้อหาหลักสูตร',
      icon: DocumentTextIcon,
      href: `/school/courses/${id}/content`,
      allowedRoles: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'question-bank',
      name: 'คลังข้อสอบ',
      icon: ArchiveBoxIcon,
      href: `/school/courses/${id}/question-bank`,
      allowedRoles: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'assignments',
      name: 'การบ้าน',
      icon: DocumentArrowUpIcon,
      href: `/school/courses/${id}/assignments`,
      allowedRoles: ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'categories',
      name: 'หมวดหมู่',
      icon: TagIcon,
      href: `/school/courses/${id}/categories`,
      allowedRoles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'completion',
      name: 'เงื่อนไขการจบหลักสูตรและระบบเกรด',
      icon: CheckCircleIcon,
      href: `/school/courses/${id}/completion-settings`,
      allowedRoles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'polls',
      name: 'แบบประเมิน',
      icon: ClipboardDocumentCheckIcon,
      href: `/school/courses/${id}/polls`,
      allowedRoles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'certificate',
      name: 'ใบประกาศนียบัตร',
      icon: AcademicCapIcon,
      href: `/school/courses/${id}/certificate`,
      allowedRoles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
    {
      id: 'teachers-students',
      name: 'อาจารย์และนักเรียน',
      icon: UserGroupIcon,
      href: `/school/courses/${id}/teachers-students`,
      allowedRoles: ['SCHOOL_ADMIN', 'SUPER_ADMIN'],
    },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (!user?.role) return false;
    const userRole = user.role.toUpperCase();
    return tab.allowedRoles.some(role => role.toUpperCase() === userRole);
  });

  // ตรวจสอบ active tab จาก pathname
  const getActiveTab = () => {
    if (pathname?.includes('/content')) return 'content';
    if (pathname?.includes('/categories')) return 'categories';
    if (pathname?.includes('/completion-settings')) return 'completion';
    if (pathname?.includes('/question-bank')) return 'question-bank';
    if (pathname?.includes('/polls')) return 'polls';
    if (pathname?.includes('/assignments')) return 'assignments';
    if (pathname?.includes('/certificate')) return 'certificate';
    if (pathname?.includes('/teachers-students')) return 'teachers-students';
    return 'content';
  };

  const activeTab = getActiveTab();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-1">จัดการหลักสูตร</p>
          </div>
        </div>
        {/* Only show edit/delete buttons for admins, not teachers */}
        {!isTeacher && (
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleEdit}>
              <PencilIcon className="h-5 w-5 mr-2 inline" />
              แก้ไข
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <TrashIcon className="h-5 w-5 mr-2 inline" />
              ลบ
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    'flex items-center space-x-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}

