'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, type Course } from '@/lib/api';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function SchoolCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getAll();
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    router.push('/school/courses/new');
  };

  const handleViewDetail = (courseId: string) => {
    router.push(`/school/courses/${courseId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการหลักสูตร</h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการหลักสูตรทั้งหมด</p>
        </div>
        <Button onClick={handleCreateCourse}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          สร้างหลักสูตรใหม่
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">ยังไม่มีหลักสูตร</p>
            <Button onClick={handleCreateCourse}>
              <PlusIcon className="h-5 w-5 mr-2 inline" />
              สร้างหลักสูตรใหม่
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
          <Card key={course.id} hover>
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to gradient if image fails to load
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium z-10 ${getStatusColor(course.status)}`}>
                {course.status === 'published' || course.status === 'PUBLISHED' ? 'เผยแพร่' : course.status === 'draft' || course.status === 'DRAFT' ? 'แบบร่าง' : course.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(course.price)}</span>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => handleViewDetail(course.id)}
              >
                ดูรายละเอียด
              </Button>
            </div>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}

