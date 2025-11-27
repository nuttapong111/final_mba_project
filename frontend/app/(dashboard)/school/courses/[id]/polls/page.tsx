'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { pollsApi, coursesApi, type PollListItem } from '@/lib/api';

export default function CoursePollsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    fetchPolls();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await coursesApi.getById(courseId);
      if (response.success && response.data) {
        setCourse(response.data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await pollsApi.getByCourse(courseId);
      if (response.success && response.data) {
        setPolls(response.data);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลแบบประเมินได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoll = () => {
    router.push(`/school/courses/${courseId}/polls/new`);
  };

  const handleEditPoll = (pollId: string) => {
    Swal.fire({
      title: 'แก้ไขแบบประเมิน',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  const handleDeletePoll = async (pollId: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบแบบประเมินนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const response = await pollsApi.delete(pollId);
        if (response.success) {
          await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'แบบประเมินถูกลบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchPolls(); // Refresh list
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถลบแบบประเมินได้',
          });
        }
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.error || error.message || 'ไม่สามารถลบแบบประเมินได้',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">แบบประเมิน</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
        <Button onClick={handleAddPoll}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มแบบประเมินใหม่
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : polls.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีแบบประเมิน</p>
            <p className="text-sm text-gray-500 mt-2">
              เพิ่มแบบประเมินในหน้า "จัดการเนื้อหาหลักสูตร"
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((pollItem) => (
            <Card key={pollItem.poll.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{pollItem.title}</h3>
                      <p className="text-sm text-gray-500">{pollItem.lessonTitle}</p>
                    </div>
                  </div>
                  {pollItem.poll.description && (
                    <p className="text-gray-600 mb-3">{pollItem.poll.description}</p>
                  )}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      จำนวนคำถาม: {pollItem.poll.questions.length} คำถาม
                    </p>
                    <div className="space-y-2">
                      {pollItem.poll.questions.slice(0, 3).map((question, index) => (
                        <div key={question.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-sm text-gray-700">
                            {index + 1}. {question.question}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ประเภท: {question.type === 'text' ? 'ข้อความ' :
                                     question.type === 'multiple_choice' ? 'ตัวเลือกเดียว' :
                                     question.type === 'checkbox' ? 'หลายตัวเลือก' : 'Rating'}
                            {question.required && ' • จำเป็นต้องตอบ'}
                          </p>
                        </div>
                      ))}
                      {pollItem.poll.questions.length > 3 && (
                        <p className="text-sm text-gray-500">
                          และอีก {pollItem.poll.questions.length - 3} คำถาม...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleEditPoll(pollItem.poll.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePoll(pollItem.poll.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
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

