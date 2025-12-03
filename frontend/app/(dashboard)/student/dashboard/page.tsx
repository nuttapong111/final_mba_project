'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, dashboardApi } from '@/lib/api';
import {
  BookOpenIcon,
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalCourses: 0,
    todaySessions: 0,
    completedCourses: 0,
    certificates: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardApi.getStudentDashboard(),
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

  const getCourseProgress = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    const student = course?.enrolledStudents?.find((s: any) => s.id === user?.id);
    return student?.progress || 0;
  };

  const completedCourses = courses.filter((course) => {
    const student = course.enrolledStudents?.find((s: any) => s.id === user?.id);
    return student && student.progress && student.progress >= 100;
  });

  const dashboardStats = [
    {
      name: 'หลักสูตรที่เรียน',
      value: stats.totalCourses,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'ห้องเรียนออนไลน์วันนี้',
      value: stats.todaySessions,
      icon: VideoCameraIcon,
      color: 'bg-green-500',
    },
    {
      name: 'หลักสูตรที่เรียนจบ',
      value: stats.completedCourses,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'ใบประกาศนียบัตร',
      value: stats.certificates,
      icon: TrophyIcon,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดนักเรียน</h1>
        <p className="text-gray-600 mt-1">ยินดีต้อนรับ นักเรียน ดีใจ</p>
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
            <h2 className="text-xl font-bold text-gray-900">หลักสูตรที่กำลังเรียน</h2>
            <a href="/student/courses" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => {
              const progress = getCourseProgress(course.id);
              return (
                <div key={course.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0">
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/80'}
                    alt={course.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{course.category}</p>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">ความคืบหน้า</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/student/courses/${course.id}`)}
                      >
                        เรียนต่อ
                      </Button>
                      {progress >= 100 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/student/courses/${course.id}/certificate`)}
                        >
                          <TrophyIcon className="h-4 w-4 mr-1 inline" />
                          ใบประกาศนียบัตร
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">ใบประกาศนียบัตร</h2>
            <a href="/student/certificates" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          {completedCourses.length === 0 ? (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">ยังไม่มีใบประกาศนียบัตร</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedCourses.slice(0, 3).map((course) => (
                <div key={course.id} className="pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <TrophyIcon className="h-8 w-8 text-yellow-500" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.category}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push(`/student/courses/${course.id}/certificate`)}
                    >
                      ดูใบประกาศ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Live Class Section - Hidden for Phase 2
      {stats.todaySessions > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">ห้องเรียนออนไลน์วันนี้</h2>
            <a href="/student/live-class" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="text-center py-8">
            <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">มีห้องเรียนออนไลน์ {stats.todaySessions} ห้องวันนี้</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/student/live-class')}
            >
              ดูห้องเรียนทั้งหมด
            </Button>
          </div>
        </Card>
      )}
      */}
        </>
      )}
    </div>
  );
}

