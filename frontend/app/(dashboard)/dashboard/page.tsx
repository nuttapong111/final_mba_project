'use client';

import Card from '@/components/ui/Card';
import { mockAnalytics, mockCourses, mockExams } from '@/lib/mockData';
import {
  AcademicCapIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const stats = [
    {
      name: 'นักเรียนทั้งหมด',
      value: mockAnalytics.totalStudents.toLocaleString('th-TH'),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'หลักสูตร',
      value: mockAnalytics.totalCourses,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      change: '+5',
    },
    {
      name: 'ข้อสอบ',
      value: mockAnalytics.totalExams,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8',
    },
    {
      name: 'คะแนนเฉลี่ย',
      value: mockAnalytics.averageScore.toFixed(1),
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      change: '+2.5%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-1">ภาพรวมระบบจัดการการเรียนรู้ออนไลน์</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} จากเดือนที่แล้ว</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">หลักสูตรล่าสุด</h2>
            <a href="/courses" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="space-y-4">
            {mockCourses.slice(0, 3).map((course) => (
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
                      {course.students} คน
                    </span>
                    <span className="flex items-center">
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      {course.rating}
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

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">ข้อสอบที่กำลังจะมาถึง</h2>
            <a href="/exams" className="text-sm text-blue-600 hover:text-blue-700">
              ดูทั้งหมด →
            </a>
          </div>
          <div className="space-y-4">
            {mockExams.map((exam) => (
              <div key={exam.id} className="pb-4 border-b border-gray-100 last:border-0">
                <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-gray-600">
                    <p>วันที่: {new Date(exam.startDate).toLocaleDateString('th-TH')}</p>
                    <p>เวลา: {new Date(exam.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {exam.duration} นาที
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/courses/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <AcademicCapIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900">สร้างหลักสูตรใหม่</p>
          </a>
          <a
            href="/exams/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900">สร้างข้อสอบใหม่</p>
          </a>
          <a
            href="/live-class/new"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <ChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-900">สร้างห้องเรียนออนไลน์</p>
          </a>
        </div>
      </Card>
    </div>
  );
}

