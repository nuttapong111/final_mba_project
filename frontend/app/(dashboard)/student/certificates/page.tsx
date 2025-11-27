'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import {
  TrophyIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function StudentCertificatesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const enrolledCourses = filterCoursesByRole(mockCourses, user);

  // Mock: Assume all courses are completed for demo
  const completedCourses = enrolledCourses.filter((course) => {
    const student = course.enrolledStudents?.find((s) => s.id === user?.id);
    return student && student.progress && student.progress >= 100;
  });

  const handleDownload = (courseId: string) => {
    Swal.fire({
      icon: 'success',
      title: 'ดาวน์โหลดใบประกาศนียบัตร',
      text: 'กำลังดาวน์โหลด...',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ใบประกาศนียบัตร</h1>
        <p className="text-gray-600 mt-1">ใบประกาศนียบัตรที่คุณได้รับ</p>
      </div>

      {completedCourses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ยังไม่มีใบประกาศนียบัตร
            </h2>
            <p className="text-gray-600 mb-6">
              คุณต้องเรียนจบหลักสูตรและผ่านแบบทดสอบทั้งหมดก่อน
            </p>
            <Button onClick={() => router.push('/student/courses')}>
              ไปเรียนหลักสูตร
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completedCourses.map((course) => (
            <Card key={course.id} hover>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrophyIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.category}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-600 font-medium">เรียนจบแล้ว</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/student/courses/${course.id}/certificate`)}
                  >
                    ดูใบประกาศนียบัตร
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleDownload(course.id)}
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

