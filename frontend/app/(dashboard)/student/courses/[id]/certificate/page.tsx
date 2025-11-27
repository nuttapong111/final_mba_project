'use client';

import { useParams, useRouter } from 'next/navigation';
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

export default function StudentCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;
  const enrolledCourses = filterCoursesByRole(mockCourses, user as any);
  const course = enrolledCourses.find(c => c.id === courseId);

  if (!course) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">ไม่พบหลักสูตร</p>
          <Button onClick={() => router.push('/student/courses')} className="mt-4">
            กลับไปหน้าหลักสูตร
          </Button>
        </div>
      </Card>
    );
  }

  // Check if course is completed (mock - in real app, check from API)
  const isCompleted = true; // Assume completed for demo

  const handleDownload = () => {
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
        <p className="text-gray-600 mt-1">ใบประกาศนียบัตรสำหรับหลักสูตร {course.title}</p>
      </div>

      {isCompleted ? (
        <Card>
          <div className="text-center py-12">
            <div className="mb-6">
              <TrophyIcon className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ยินดีด้วย!
              </h2>
              <p className="text-gray-600">
                คุณได้เรียนจบหลักสูตร <strong>{course.title}</strong> แล้ว
              </p>
            </div>

            {/* Certificate Preview */}
            <div className="bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border-4 border-yellow-400 rounded-lg p-12 max-w-2xl mx-auto mb-8">
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-bold text-gray-900 mb-2">
                  ใบประกาศนียบัตร
                </h3>
                <p className="text-xl text-gray-700 mb-6">
                  ประกาศว่า
                </p>
                <p className="text-2xl font-bold text-blue-600 mb-6">
                  {user?.name || 'นักเรียน'}
                </p>
                <p className="text-lg text-gray-700 mb-4">
                  ได้เรียนจบหลักสูตร
                </p>
                <p className="text-xl font-semibold text-gray-900 mb-6">
                  {course.title}
                </p>
                <div className="flex items-center justify-center space-x-8 mt-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">วันที่จบ</p>
                    <p className="font-semibold text-gray-900">
                      {new Date().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-300">
                  <p className="text-sm text-gray-600">โรงเรียนกวดวิชา ABC</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/student/courses')}>
                กลับไปหน้าหลักสูตร
              </Button>
              <Button onClick={handleDownload}>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2 inline" />
                ดาวน์โหลดใบประกาศนียบัตร
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ยังไม่สามารถรับใบประกาศนียบัตรได้
            </h2>
            <p className="text-gray-600 mb-6">
              คุณต้องเรียนจบหลักสูตรและผ่านแบบทดสอบทั้งหมดก่อน
            </p>
            <Button onClick={() => router.push(`/student/courses/${courseId}`)}>
              กลับไปเรียนต่อ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

