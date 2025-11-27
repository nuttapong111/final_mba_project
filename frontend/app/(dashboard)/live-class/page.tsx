'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  VideoCameraIcon,
  PlusIcon,
  ClockIcon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface LiveClass {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: number;
  students: number;
  status: 'scheduled' | 'live' | 'ended';
}

const mockLiveClasses: LiveClass[] = [
  {
    id: '1',
    title: 'คณิตศาสตร์ ม.4 - บทที่ 1',
    instructor: 'อาจารย์ สมศรี',
    date: '2024-03-20',
    time: '09:00',
    duration: 60,
    students: 45,
    status: 'scheduled',
  },
  {
    id: '2',
    title: 'ภาษาอังกฤษ TOEIC - Listening',
    instructor: 'อาจารย์ สมศรี',
    date: '2024-03-21',
    time: '14:00',
    duration: 90,
    students: 60,
    status: 'scheduled',
  },
];

export default function LiveClassPage() {
  const [classes] = useState(mockLiveClasses);

  const handleCreateClass = () => {
    Swal.fire({
      title: 'สร้างห้องเรียนออนไลน์',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'กำหนดสอน';
      case 'live':
        return 'กำลังสอน';
      case 'ended':
        return 'สอนเสร็จแล้ว';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ห้องเรียนออนไลน์</h1>
          <p className="text-gray-600 mt-1">จัดการห้องเรียนออนไลน์แบบ Real-time</p>
        </div>
        <Button onClick={handleCreateClass}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          สร้างห้องเรียนใหม่
        </Button>
      </div>

      {/* Live Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} hover>
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <VideoCameraIcon className="h-16 w-16 text-white opacity-80" />
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(classItem.status)}`}>
                {getStatusLabel(classItem.status)}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.title}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  <span>{classItem.instructor}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>{new Date(classItem.date).toLocaleDateString('th-TH')} เวลา {classItem.time}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>{classItem.duration} นาที</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  <span>{classItem.students} คน</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                {classItem.status === 'scheduled' && (
                  <Button variant="primary" className="flex-1">
                    เข้าห้องเรียน
                  </Button>
                )}
                {classItem.status === 'live' && (
                  <Button variant="primary" className="flex-1">
                    เข้าร่วมทันที
                  </Button>
                )}
                {classItem.status === 'ended' && (
                  <Button variant="outline" className="flex-1">
                    ดูบันทึก
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  แก้ไข
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">ยังไม่มีห้องเรียนออนไลน์</p>
            <Button onClick={handleCreateClass}>
              สร้างห้องเรียนแรกของคุณ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

