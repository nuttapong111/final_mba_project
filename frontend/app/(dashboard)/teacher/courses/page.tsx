'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import { AcademicCapIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function TeacherCoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getCourses();
      
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h1>
        <p className="text-gray-600 mt-1">จัดการหลักสูตรที่คุณสอน</p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <Card className="col-span-full">
              <div className="text-center py-12">
                <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ยังไม่มีหลักสูตร</p>
              </div>
            </Card>
          ) : (
            courses.map((course) => (
          <Card key={course.id} hover>
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {course.students || course.enrolledStudents?.length || 0} คน
                    </span>
                    {course.duration && (
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {course.duration} ชม.
                      </span>
                    )}
                  </div>
              <Button variant="primary" size="sm">จัดการ</Button>
            </div>
          </Card>
            ))
          )}
      </div>
      )}
    </div>
  );
}

