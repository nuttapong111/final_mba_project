'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { schoolsApi, type School } from '@/lib/api';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await schoolsApi.getAll();
      
      if (response.success && response.data) {
        setSchools(response.data);
      } else {
        throw new Error(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      console.error('Error fetching schools:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดข้อมูลสถาบันได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการสถาบัน</h1>
          <p className="text-gray-600 mt-1">จัดการสถาบันทั้งหมดในระบบ</p>
        </div>
        <Button>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มสถาบันใหม่
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : schools.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีสถาบันในระบบ</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <Card key={school.id} hover>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                  {school.domain && (
                    <p className="text-sm text-gray-600">{school.domain}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {school.subscription && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">แพ็กเกจ:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      school.subscription === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                      school.subscription === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {school.subscription}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">วันที่สร้าง:</span>
                  <span className="text-sm text-gray-900">{formatDate(school.createdAt)}</span>
                </div>
                {school.userCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ผู้ใช้งาน:</span>
                    <span className="text-sm text-gray-900">{school.userCount} คน</span>
                  </div>
                )}
                {school.adminCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ผู้ดูแล:</span>
                    <span className="text-sm text-gray-900">{school.adminCount} คน</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <Button variant="primary" className="flex-1">
                  ดูรายละเอียด
                </Button>
                <Button variant="outline">
                  แก้ไข
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

