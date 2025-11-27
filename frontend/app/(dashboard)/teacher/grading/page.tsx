'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface GradingTask {
  id: string;
  courseId: string;
  courseTitle: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  aiScore?: number; // AI suggested score
  aiFeedback?: string; // AI feedback
  teacherScore?: number; // Teacher's final score
  teacherFeedback?: string;
  status: 'pending' | 'graded';
  questionType: 'essay' | 'short_answer';
  answer: string;
}

export default function TeacherGradingPage() {
  const { user } = useAuthStore();
  const myCourses = filterCoursesByRole(mockCourses, user as any);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock grading tasks
  const [gradingTasks, setGradingTasks] = useState<GradingTask[]>([
    {
      id: '1',
      courseId: '1',
      courseTitle: 'คณิตศาสตร์ ม.4',
      examId: 'exam-1',
      examTitle: 'ข้อสอบคณิตศาสตร์ ม.4 - บทที่ 1',
      studentId: '4',
      studentName: 'นักเรียน ดีใจ',
      studentAvatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
      submittedAt: '2024-03-15T10:30:00',
      aiScore: 75,
      aiFeedback: 'คำตอบถูกต้องส่วนใหญ่ แต่ยังขาดรายละเอียดบางส่วน ควรอธิบายขั้นตอนการคิดให้ชัดเจนขึ้น',
      status: 'pending',
      questionType: 'essay',
      answer: 'ในการแก้สมการ x² + 5x + 6 = 0 ฉันใช้วิธีแยกตัวประกอบ โดยหาจำนวนสองจำนวนที่คูณกันได้ 6 และบวกกันได้ 5 ซึ่งคือ 2 และ 3 ดังนั้น (x+2)(x+3) = 0 ดังนั้น x = -2 หรือ x = -3',
    },
    {
      id: '2',
      courseId: '1',
      courseTitle: 'คณิตศาสตร์ ม.4',
      examId: 'exam-1',
      examTitle: 'ข้อสอบคณิตศาสตร์ ม.4 - บทที่ 1',
      studentId: '7',
      studentName: 'นักเรียน สมชาย',
      studentAvatar: 'https://ui-avatars.com/api/?name=สมชาย&background=3b82f6&color=fff',
      submittedAt: '2024-03-15T11:00:00',
      aiScore: 85,
      aiFeedback: 'คำตอบถูกต้องและมีรายละเอียดดี อธิบายขั้นตอนได้ชัดเจน',
      status: 'pending',
      questionType: 'essay',
      answer: 'ในการแก้สมการ x² + 5x + 6 = 0 ฉันใช้วิธีแยกตัวประกอบ:\n\n1. หาจำนวนสองจำนวนที่คูณกันได้ 6 และบวกกันได้ 5\n2. จำนวนที่เหมาะสมคือ 2 และ 3\n3. แยกตัวประกอบได้ (x+2)(x+3) = 0\n4. ดังนั้น x = -2 หรือ x = -3\n\nตรวจสอบ: (-2)² + 5(-2) + 6 = 4 - 10 + 6 = 0 ✓',
    },
    {
      id: '3',
      courseId: '2',
      courseTitle: 'ภาษาอังกฤษ TOEIC',
      examId: 'exam-2',
      examTitle: 'ข้อสอบ TOEIC - Writing',
      studentId: '4',
      studentName: 'นักเรียน ดีใจ',
      studentAvatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
      submittedAt: '2024-03-16T09:15:00',
      aiScore: 70,
      aiFeedback: 'โครงสร้างประโยคดี แต่ยังมีข้อผิดพลาดทางไวยากรณ์บางจุด',
      status: 'graded',
      teacherScore: 75,
      teacherFeedback: 'ปรับปรุงการใช้ tense ให้ถูกต้อง',
      questionType: 'essay',
      answer: 'I think that technology has both positive and negative effects. On one hand, it make our life easier. On the other hand, it can cause problems like addiction.',
    },
  ]);

  const filteredTasks = gradingTasks.filter((task) => {
    const courseMatch = selectedCourse === 'all' || task.courseId === selectedCourse;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    const searchMatch =
      task.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return courseMatch && statusMatch && searchMatch;
  });

  const handleGrade = (taskId: string, score: number, feedback: string) => {
    setGradingTasks(
      gradingTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              teacherScore: score,
              teacherFeedback: feedback,
              status: 'graded' as const,
            }
          : task
      )
    );

    Swal.fire({
      icon: 'success',
      title: 'บันทึกคะแนนสำเร็จ!',
      text: 'บันทึกคะแนนและความคิดเห็นเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = gradingTasks.filter((t) => t.status === 'pending').length;
  const gradedCount = gradingTasks.filter((t) => t.status === 'graded').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตรวจข้อสอบ</h1>
        <p className="text-gray-600 mt-1">ตรวจข้อสอบอัตนัยของนักเรียน พร้อมคำแนะนำจาก AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">งานที่ต้องตรวจ</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ตรวจแล้ว</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{gradedCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{gradingTasks.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหานักเรียนหรือข้อสอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทุกหลักสูตร</option>
            {myCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'graded')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">ยังไม่ตรวจ</option>
            <option value="graded">ตรวจแล้ว</option>
          </select>
        </div>
      </Card>

      {/* Grading Tasks */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบงานที่ต้องตรวจ</p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <GradingTaskCard
              key={task.id}
              task={task}
              onGrade={handleGrade}
              formatDateTime={formatDateTime}
            />
          ))
        )}
      </div>
    </div>
  );
}

function GradingTaskCard({
  task,
  onGrade,
  formatDateTime,
}: {
  task: GradingTask;
  onGrade: (taskId: string, score: number, feedback: string) => void;
  formatDateTime: (date: string) => string;
}) {
  const [score, setScore] = useState(task.teacherScore?.toString() || task.aiScore?.toString() || '');
  const [feedback, setFeedback] = useState(task.teacherFeedback || task.aiFeedback || '');
  const [isEditing, setIsEditing] = useState(task.status === 'pending');

  const handleSubmit = () => {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      Swal.fire({
        icon: 'error',
        title: 'คะแนนไม่ถูกต้อง',
        text: 'กรุณากรอกคะแนนระหว่าง 0-100',
      });
      return;
    }
    onGrade(task.id, scoreNum, feedback);
    setIsEditing(false);
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <img
              src={task.studentAvatar || 'https://ui-avatars.com/api/?name=Student'}
              alt={task.studentName}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{task.studentName}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {task.courseTitle}
                </span>
                {task.status === 'graded' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    ตรวจแล้ว
                  </span>
                )}
                {task.status === 'pending' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    ยังไม่ตรวจ
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">{task.examTitle}</p>
              <p className="text-xs text-gray-500 mt-1">ส่งเมื่อ: {formatDateTime(task.submittedAt)}</p>
            </div>
          </div>
        </div>

        {/* Student Answer */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">คำตอบของนักเรียน:</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{task.answer}</p>
          </div>
        </div>

        {/* AI Feedback */}
        {task.aiScore !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">คำแนะนำจาก AI:</h4>
              <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-sm font-medium">
                คะแนนแนะนำ: {task.aiScore}/100
              </span>
            </div>
            <p className="text-blue-800 text-sm">{task.aiFeedback}</p>
          </div>
        )}

        {/* Grading Form */}
        {isEditing ? (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คะแนน (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความคิดเห็น/ข้อเสนอแนะ
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="พิมพ์ความคิดเห็นหรือข้อเสนอแนะ..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmit}>
                <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                บันทึกคะแนน
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">คะแนนที่ให้:</h4>
              <span className="text-2xl font-bold text-green-600">{task.teacherScore}/100</span>
            </div>
            {task.teacherFeedback && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                <p className="text-green-800 text-sm">{task.teacherFeedback}</p>
              </div>
            )}
            {task.status === 'graded' && (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="mt-4">
                แก้ไขคะแนน
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

