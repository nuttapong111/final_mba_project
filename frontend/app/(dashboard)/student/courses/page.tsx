'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import { BookOpenIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: string;
  progress: number;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getCourses();
        if (response.success && response.data) {
          setEnrolledCourses(response.data);
        } else {
          console.error('Error fetching courses:', response.error);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
          });
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getCourseProgress = (courseId: string) => {
    const course = enrolledCourses.find((c: any) => c.id === courseId);
    const student = course?.enrolledStudents?.find((s: EnrolledStudent) => s.id === user?.id);
    return student?.progress || 0;
  };

  const isCourseCompleted = (courseId: string) => {
    const progress = getCourseProgress(courseId);
    return progress >= 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h1>
          <p className="text-gray-600 mt-1">หลักสูตรที่คุณลงทะเบียนเรียน</p>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">หลักสูตรที่คุณลงทะเบียนเรียน</p>
      </div>

      {enrolledCourses.length === 0 ? (
        <Card>
          <div className="text-center py-8 sm:py-12">
            <BookOpenIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">คุณยังไม่ได้ลงทะเบียนเรียนหลักสูตรใด</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {enrolledCourses.map((course) => {
          const progress = getCourseProgress(course.id);
          const completed = isCourseCompleted(course.id);
          
          return (
          <Card key={course.id} hover>
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <img
                src={course.thumbnail || 'https://via.placeholder.com/120'}
                alt={course.title}
                className="w-full sm:w-32 h-48 sm:h-32 rounded-lg object-cover"
              />
              <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">{course.title}</h3>
                    {completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center whitespace-nowrap">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        เรียนจบแล้ว
                      </span>
                    )}
                  </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                        ความคืบหน้า
                  </span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                </div>
                  <Button
                    variant="primary"
                    className="w-full text-sm sm:text-base"
                    onClick={() => router.push(`/student/courses/${course.id}`)}
                  >
                    {completed ? 'ดูใบประกาศนียบัตร' : 'เรียนต่อ'}
                  </Button>
              </div>
            </div>
          </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}

