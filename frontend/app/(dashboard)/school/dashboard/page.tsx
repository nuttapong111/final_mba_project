'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import { coursesApi, dashboardApi } from '@/lib/api';
import {
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function SchoolDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalExams: 0,
    averageScore: 0,
    completionRate: 0,
    activeUsers: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardApi.getSchoolDashboard(),
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
      name: 'นักเรียนทั้งหมด',
      value: stats.totalStudents.toLocaleString('th-TH'),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'หลักสูตร',
      value: stats.totalCourses,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      change: '+5',
    },
    {
      name: 'ข้อสอบ',
      value: stats.totalExams,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8',
    },
    {
      name: 'คะแนนเฉลี่ย',
      value: stats.averageScore.toFixed(1),
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      change: '+2.5%',
    },
    {
      name: 'อัตราการเรียนจบ',
      value: `${stats.completionRate.toFixed(1)}%`,
      icon: CheckCircleIcon,
      color: 'bg-green-600',
      change: '+3.2%',
    },
    {
      name: 'ผู้ใช้งานออนไลน์',
      value: stats.activeUsers,
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
      change: '+45',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดสถาบัน</h1>
        <p className="text-gray-600 mt-1">ภาพรวมสถาบันของคุณ</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardStats.map((stat) => (
          <Card key={stat.name} hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                  <p className="text-sm text-green-600">{stat.change} จากเดือนที่แล้ว</p>
                </div>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">ตัวชี้วัดประสิทธิภาพ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.completionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">อัตราการเรียนจบ</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.averageScore.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">คะแนนเฉลี่ย</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {stats.totalStudents > 0 ? ((stats.activeUsers / stats.totalStudents) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">อัตราการใช้งาน</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">หลักสูตรล่าสุด</h2>
            <a href="/school/courses" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => (
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
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      {course.rating || 0}
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
      </div>
        </>
      )}
    </div>
  );
}

