'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockSchools } from '@/lib/mockData';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function AdminSchoolsPage() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockSchools.map((school) => (
          <Card key={school.id} hover>
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                <p className="text-sm text-gray-600">{school.domain}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">แพ็กเกจ:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  school.subscription === 'premium' ? 'bg-purple-100 text-purple-800' :
                  school.subscription === 'basic' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.subscription}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">วันที่สร้าง:</span>
                <span className="text-sm text-gray-900">{new Date(school.createdAt).toLocaleDateString('th-TH')}</span>
              </div>
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
    </div>
  );
}

