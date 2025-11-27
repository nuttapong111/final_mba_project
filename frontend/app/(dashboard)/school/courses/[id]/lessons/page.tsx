'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getCourseWithLessons, mockLessons } from '@/lib/mockData';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  VideoCameraIcon,
  DocumentIcon,
  LinkIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function CourseLessonsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const course = getCourseWithLessons(courseId);
  const [lessons, setLessons] = useState(course?.lessons || mockLessons.filter(l => l.courseId === courseId));

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return VideoCameraIcon;
      case 'document':
        return DocumentIcon;
      case 'live_link':
        return LinkIcon;
      case 'quiz':
        return DocumentTextIcon;
      case 'pre_test':
        return AcademicCapIcon;
      case 'poll':
        return DocumentTextIcon;
      default:
        return DocumentIcon;
    }
  };

  const getContentLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'วิดีโอ';
      case 'document':
        return 'เอกสาร';
      case 'live_link':
        return 'สอนสด';
      case 'quiz':
        return 'ข้อสอบ';
      case 'pre_test':
        return 'ทดสอบก่อนเรียน';
      case 'poll':
        return 'แบบประเมิน';
      default:
        return type;
    }
  };

  const handleAddLesson = () => {
    router.push(`/school/courses/${courseId}/lessons/new`);
  };

  const handleEditLesson = (lessonId: string) => {
    router.push(`/school/courses/${courseId}/lessons/${lessonId}/edit`);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณต้องการลบบทเรียนนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      setLessons(lessons.filter(l => l.id !== lessonId));
      await Swal.fire({
        icon: 'success',
        title: 'ลบสำเร็จ!',
        text: 'บทเรียนถูกลบเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/school/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการบทเรียน</h1>
            <p className="text-gray-600 mt-1">{course?.title}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {course?.courseType === 'video' && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/school/courses/${courseId}/content`)}
            >
              จัดการเนื้อหาทั้งหมด
            </Button>
          )}
          <Button onClick={handleAddLesson}>
            <PlusIcon className="h-5 w-5 mr-2 inline" />
            เพิ่มบทเรียนใหม่
          </Button>
        </div>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">ยังไม่มีบทเรียน</p>
            <Button onClick={handleAddLesson}>
              เพิ่มบทเรียนแรก
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-13 space-y-2">
                    {lesson.contents.map((content) => {
                      const Icon = getContentIcon(content.type);
                      return (
                        <div
                          key={content.id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Icon className="h-5 w-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{content.title}</p>
                            <p className="text-xs text-gray-500">
                              {getContentLabel(content.type)}
                              {content.duration && ` • ${content.duration} นาที`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEditLesson(lesson.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



