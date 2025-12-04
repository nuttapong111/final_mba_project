'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, gradingApi, type GradingTask } from '@/lib/api';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function TeacherGradingPage() {
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingTasks, setGradingTasks] = useState<GradingTask[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Show loading indicator
      Swal.fire({
        title: 'กำลังโหลดข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const [tasksResponse, coursesResponse] = await Promise.all([
        gradingApi.getGradingTasks(),
        coursesApi.getCourses(),
      ]);

      if (tasksResponse.success && tasksResponse.data) {
        setGradingTasks(tasksResponse.data);
        
        // Check if any tasks need AI feedback
        const tasksNeedingAI = tasksResponse.data.filter(
          (task) => task.status === 'pending' && (!task.aiScore || !task.aiFeedback)
        );

        if (tasksNeedingAI.length > 0) {
          // Update loading message
          Swal.fire({
            title: `กำลังสร้างคำแนะนำจาก AI... (${tasksNeedingAI.length} งาน)`,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          // Generate AI feedback for tasks that need it
          for (const task of tasksNeedingAI) {
            // Skip if question or answer is missing
            if (!task.question || !task.answer) {
              console.warn(`Skipping AI feedback for task ${task.id}: missing question or answer`);
              continue;
            }
            
            try {
              const aiResponse = await gradingApi.generateAIFeedback({
                question: task.question,
                answer: task.answer,
                maxScore: task.maxScore,
              });
              
              if (aiResponse.success && aiResponse.data) {
                // Update task with AI feedback
                setGradingTasks((prev) =>
                  prev.map((t) =>
                    t.id === task.id
                      ? { ...t, aiScore: aiResponse.data!.score, aiFeedback: aiResponse.data!.feedback }
                      : t
                  )
                );
              }
            } catch (error) {
              console.error(`Error generating AI feedback for task ${task.id}:`, error);
            }
          }
          
          Swal.close();
        } else {
          Swal.close();
        }
      }

      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching grading data:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };


  const filteredTasks = gradingTasks.filter((task) => {
    const courseMatch = selectedCourse === 'all' || task.courseId === selectedCourse;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    const searchMatch =
      task.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return courseMatch && statusMatch && searchMatch;
  });

  const handleGrade = async (taskId: string, score: number, feedback: string) => {
    try {
      const response = await gradingApi.updateGradingTask(taskId, {
        teacherScore: score,
        teacherFeedback: feedback,
      });

      if (response.success) {
        // Update local state
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

        await Swal.fire({
          icon: 'success',
          title: 'บันทึกคะแนนสำเร็จ!',
          text: 'บันทึกคะแนนและความคิดเห็นเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.error || 'ไม่สามารถบันทึกคะแนนได้');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกคะแนนได้',
      });
    }
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
            {courses.map((course) => (
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
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
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
      )}
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
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleSubmit = () => {
    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > task.maxScore) {
      Swal.fire({
        icon: 'error',
        title: 'คะแนนไม่ถูกต้อง',
        text: `กรุณากรอกคะแนนระหว่าง 0-${task.maxScore}`,
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

        {/* Question */}
        {task.question && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">คำถาม:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{task.question}</p>
            </div>
          </div>
        )}

        {/* Student Answer */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">คำตอบของนักเรียน:</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{task.answer}</p>
          </div>
        </div>

        {/* AI Feedback */}
        {task.aiScore !== undefined && task.aiFeedback ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">คำแนะนำจาก AI:</h4>
              <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-sm font-medium">
                คะแนนแนะนำ: {task.aiScore}/{task.maxScore}
              </span>
            </div>
            <p className="text-blue-800 text-sm">{task.aiFeedback}</p>
          </div>
        ) : isEditing && !generatingAI ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Button
              variant="outline"
              onClick={async () => {
                // Validate question and answer before calling API
                if (!task.question || !task.answer) {
                  Swal.fire({
                    icon: 'error',
                    title: 'ข้อมูลไม่ครบถ้วน',
                    text: 'ไม่พบคำถามหรือคำตอบ กรุณาตรวจสอบข้อมูล',
                  });
                  return;
                }
                
                setGeneratingAI(true);
                try {
                  const response = await gradingApi.generateAIFeedback({
                    question: task.question,
                    answer: task.answer,
                    maxScore: task.maxScore,
                  });
                  if (response.success && response.data) {
                    setScore(response.data.score.toString());
                    setFeedback(response.data.feedback);
                    await Swal.fire({
                      icon: 'success',
                      title: 'สร้างคำแนะนำสำเร็จ!',
                      text: 'ได้รับคำแนะนำจาก Gemini AI แล้ว',
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  } else {
                    throw new Error(response.error || 'ไม่สามารถสร้างคำแนะนำได้');
                  }
                } catch (error: any) {
                  console.error('Error generating AI feedback:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้ กรุณาตรวจสอบว่าได้ตั้งค่า GEMINI_API_KEY แล้วหรือยัง',
                    confirmButtonText: 'เข้าใจแล้ว',
                  });
                } finally {
                  setGeneratingAI(false);
                }
              }}
            >
              {generatingAI ? 'กำลังสร้างคำแนะนำ...' : 'ขอคำแนะนำจาก AI'}
            </Button>
          </div>
        ) : null}

        {/* Grading Form */}
        {isEditing ? (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คะแนน (0-{task.maxScore})
              </label>
              <input
                type="number"
                min="0"
                max={task.maxScore}
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
              <span className="text-2xl font-bold text-green-600">{task.teacherScore}/{task.maxScore}</span>
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

