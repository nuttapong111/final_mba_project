'use client';

import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function TeacherCoursesPage() {
  const { user } = useAuthStore();
  const myCourses = filterCoursesByRole(mockCourses, user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h1>
        <p className="text-gray-600 mt-1">จัดการหลักสูตรที่คุณสอน</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myCourses.map((course) => (
          <Card key={course.id} hover>
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{course.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">{course.students} นักเรียน</span>
              <Button variant="primary" size="sm">จัดการ</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

