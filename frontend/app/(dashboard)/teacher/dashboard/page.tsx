'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import { coursesApi, dashboardApi } from '@/lib/api';
import {
  AcademicCapIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalExams: 0,
    pendingGradingTasks: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardApi.getTeacherDashboard(),
          coursesApi.getCourses(),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
        if (coursesResponse.success && coursesResponse.data) {
          setCourses(coursesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dashboardStats = [
    {
      name: 'หลักสูตรของฉัน',
      value: stats.totalCourses,
      icon: AcademicCapIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'นักเรียนทั้งหมด',
      value: stats.totalStudents,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      name: 'ข้อสอบ',
      value: stats.totalExams,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'งานที่ต้องตรวจ',
      value: stats.pendingGradingTasks,
      icon: CheckCircleIcon,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดครูผู้สอน</h1>
        <p className="text-gray-600 mt-1">ยินดีต้อนรับ อาจารย์ สมศรี</p>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat) => (
          <Card key={stat.name} hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">หลักสูตรของฉัน</h2>
            <a href="/teacher/courses" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0">
                <img
                  src={course.thumbnail || 'https://via.placeholder.com/80'}
                  alt={course.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.category}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {course.students || course.enrolledStudents?.length || 0} คน
                    </span>
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {course.duration} ชม.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        </Card>
        </>
      )}
    </div>
  );
}

