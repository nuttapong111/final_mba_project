'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { dashboardApi } from '@/lib/api';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalRevenue: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getAdminDashboard();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดข้อมูลรายงานได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const analyticsCards = [
    {
      name: 'สถาบันทั้งหมด',
      value: stats.totalSchools,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'ผู้ใช้งานทั้งหมด',
      value: stats.totalUsers.toLocaleString('th-TH'),
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      name: 'รายได้รวม',
      value: `฿${stats.totalRevenue.toLocaleString('th-TH')}`,
      icon: BanknotesIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'อัตราการเติบโต',
      value: `+${stats.growthRate}%`,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">รายงานระบบ</h1>
        <p className="text-gray-600 mt-1">รายงานและสถิติของระบบ</p>
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
            {analyticsCards.map((stat) => (
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

          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">รายละเอียดเพิ่มเติม</h2>
            <div className="text-gray-600">
              <p>รายงานระบบจะแสดงข้อมูลสถิติและรายละเอียดต่างๆ ของระบบ</p>
              <p className="mt-2">ฟีเจอร์เพิ่มเติมจะถูกเพิ่มในอนาคต</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
