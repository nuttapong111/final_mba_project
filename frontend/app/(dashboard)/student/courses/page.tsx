'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import { BookOpenIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function StudentCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const enrolledCourses = filterCoursesByRole(mockCourses, user as any);

  const getCourseProgress = (courseId: string) => {
    const course = enrolledCourses.find(c => c.id === courseId);
    const student = course?.enrolledStudents?.find(s => s.id === user?.id);
    return student?.progress || 0;
  };

  const isCourseCompleted = (courseId: string) => {
    const progress = getCourseProgress(courseId);
    return progress >= 100;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h1>
        <p className="text-gray-600 mt-1">หลักสูตรที่คุณลงทะเบียนเรียน</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enrolledCourses.map((course) => {
          const progress = getCourseProgress(course.id);
          const completed = isCourseCompleted(course.id);
          
          return (
          <Card key={course.id} hover>
            <div className="flex items-start space-x-4">
              <img
                src={course.thumbnail || 'https://via.placeholder.com/120'}
                alt={course.title}
                className="w-32 h-32 rounded-lg object-cover"
              />
              <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                    {completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        เรียนจบแล้ว
                      </span>
                    )}
                  </div>
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
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
                    className="w-full"
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
    </div>
  );
}

