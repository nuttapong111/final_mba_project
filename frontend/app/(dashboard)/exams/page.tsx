'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockExams, mockCourses } from '@/lib/mockData';
import { getStatusColor } from '@/lib/utils';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function ExamsPage() {
  const router = useRouter();
  const [exams] = useState(mockExams);

  const getCourseTitle = (courseId: string) => {
    return mockCourses.find(c => c.id === courseId)?.title || 'ไม่พบหลักสูตร';
  };

  const handleCreateExam = () => {
    router.push('/exams/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการข้อสอบ</h1>
          <p className="text-gray-600 mt-1">สร้างและจัดการข้อสอบทั้งหมด</p>
        </div>
        <Button onClick={handleCreateExam}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          สร้างข้อสอบใหม่
        </Button>
      </div>

      {/* Exams List */}
      <div className="grid grid-cols-1 gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} hover>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {exam.status === 'scheduled' ? 'กำหนดสอบ' : exam.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">หลักสูตร: {getCourseTitle(exam.courseId)}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">ประเภท</p>
                    <p className="font-medium text-gray-900">
                      {exam.type === 'quiz' ? 'แบบทดสอบ' : exam.type === 'midterm' ? 'สอบกลางภาค' : 'สอบปลายภาค'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">จำนวนข้อ</p>
                    <p className="font-medium text-gray-900">{exam.totalQuestions} ข้อ</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">เวลา</p>
                    <p className="font-medium text-gray-900">{exam.duration} นาที</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">คะแนนเต็ม</p>
                    <p className="font-medium text-gray-900">{exam.totalScore} คะแนน</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    เริ่ม: {new Date(exam.startDate).toLocaleString('th-TH')}
                  </span>
                  <span className="mx-2">-</span>
                  <span>
                    สิ้นสุด: {new Date(exam.endDate).toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button variant="primary" size="sm">
                  ดูรายละเอียด
                </Button>
                <Button variant="outline" size="sm">
                  แก้ไข
                </Button>
                <Button variant="ghost" size="sm">
                  ลบ
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีข้อสอบ</p>
            <Button onClick={handleCreateExam} className="mt-4">
              สร้างข้อสอบแรกของคุณ
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

