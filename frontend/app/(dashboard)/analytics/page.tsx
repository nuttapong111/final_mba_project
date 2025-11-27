'use client';

import Card from '@/components/ui/Card';
import { mockAnalytics } from '@/lib/mockData';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const stats = [
    {
      name: 'นักเรียนทั้งหมด',
      value: mockAnalytics.totalStudents.toLocaleString('th-TH'),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
    },
    {
      name: 'หลักสูตร',
      value: mockAnalytics.totalCourses,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      change: '+5',
      trend: 'up',
    },
    {
      name: 'ข้อสอบ',
      value: mockAnalytics.totalExams,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8',
      trend: 'up',
    },
    {
      name: 'คะแนนเฉลี่ย',
      value: mockAnalytics.averageScore.toFixed(1),
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      change: '+2.5%',
      trend: 'up',
    },
    {
      name: 'อัตราการเรียนจบ',
      value: `${mockAnalytics.completionRate.toFixed(1)}%`,
      icon: CheckCircleIcon,
      color: 'bg-green-600',
      change: '+3.2%',
      trend: 'up',
    },
    {
      name: 'ผู้ใช้งานออนไลน์',
      value: mockAnalytics.activeUsers,
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
      change: '+45',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายงานและวิเคราะห์</h1>
        <p className="text-gray-600 mt-1">ข้อมูลสถิติและรายงานการใช้งานระบบ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
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

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">กราฟคะแนนเฉลี่ย</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">กราฟจะแสดงที่นี่ (Chart.js / Recharts)</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">กราฟอัตราการเข้าเรียน</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">กราฟจะแสดงที่นี่ (Chart.js / Recharts)</p>
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">ตัวชี้วัดประสิทธิภาพ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{mockAnalytics.completionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">อัตราการเรียนจบ</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{mockAnalytics.averageScore.toFixed(1)}</p>
            <p className="text-sm text-gray-600 mt-1">คะแนนเฉลี่ย</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {((mockAnalytics.activeUsers / mockAnalytics.totalStudents) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">อัตราการใช้งาน</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

