'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { dashboardApi, usersApi } from '@/lib/api';
import {
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalUsers: 0,
    totalRevenue: 0,
    growthRate: 0,
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsResponse, usersResponse] = await Promise.all([
          dashboardApi.getAdminDashboard(),
          usersApi.getAll(),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
        // Get schools from users (filter by SCHOOL_ADMIN role)
        if (usersResponse.success && usersResponse.data) {
          const schoolAdmins = usersResponse.data.filter((u: any) => u.role === 'SCHOOL_ADMIN' || u.role === 'school_admin');
          setSchools(schoolAdmins);
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
      name: 'สถาบันทั้งหมด',
      value: stats.totalSchools || schools.length,
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
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-gray-600 mt-1">ภาพรวมระบบทั้งหมด</p>
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

          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถาบันที่ลงทะเบียน</h2>
            {schools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">ยังไม่มีสถาบันที่ลงทะเบียน</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{school.name}</h3>
                      <p className="text-sm text-gray-600">{school.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        School Admin
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

