'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import { assignmentGradingApi, type AssignmentGradingTask } from '@/lib/api/assignmentGrading';
import {
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  UserCircleIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function TeacherAssignmentsPage() {
  const { user } = useAuthStore();
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradingTasks, setGradingTasks] = useState<AssignmentGradingTask[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState<Set<string>>(new Set()); // Track which tasks are generating AI
  const [selectedTask, setSelectedTask] = useState<AssignmentGradingTask | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, coursesResponse] = await Promise.all([
        assignmentGradingApi.getTasks(),
        coursesApi.getCourses(),
      ]);

      if (tasksResponse.success && tasksResponse.data) {
        setGradingTasks(tasksResponse.data);
        
        // Check if any tasks need AI feedback generation
        const tasksNeedingAI = tasksResponse.data.filter(
          (task) => task.status === 'pending' && !task.aiScore && !task.aiFeedback
        );
        
        if (tasksNeedingAI.length > 0) {
          // Show loading message for AI generation
          Swal.fire({
            title: 'กำลังประมวลผลข้อเสนอแนะจาก AI',
            text: `กรุณารอสักครู่ กำลังสร้างคำแนะนำสำหรับ ${tasksNeedingAI.length} รายการ...`,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          
          Swal.close();
        }
      }

      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching assignment grading data:', error);
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

  // Callback to update task and refresh data
  const handleUpdateTask = async (updatedTask: AssignmentGradingTask) => {
    setGradingTasks(prevTasks => 
      prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
    // Refresh data from server to ensure consistency
    await fetchData();
  };

  const handleGrade = async (taskId: string, score: number, feedback: string) => {
    try {
      const response = await assignmentGradingApi.gradeSubmission(taskId, {
        score,
        feedback,
      });

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกคะแนนสำเร็จ!',
          text: 'บันทึกคะแนนการบ้านเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchData();
        setSelectedTask(null);
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

  const filteredTasks = gradingTasks.filter((task) => {
    const matchesCourse = selectedCourse === 'all' || task.courseId === selectedCourse;
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      task.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCourse && matchesStatus && matchesSearch;
  });

  const stats = {
    pending: gradingTasks.filter((t) => t.status === 'pending').length,
    graded: gradingTasks.filter((t) => t.status === 'graded').length,
    total: gradingTasks.length,
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตรวจการบ้าน</h1>
        <p className="text-gray-600 mt-1">ตรวจการบ้านของนักเรียนและให้คะแนน</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">งานที่ต้องตรวจ</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ตรวจแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">{stats.graded}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DocumentIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
              placeholder="ค้นหานักเรียนหรือการบ้าน..."
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

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบการบ้านที่ต้องตรวจ</p>
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <AssignmentGradingCard
              key={task.id}
              task={task}
              onGrade={handleGrade}
              formatDateTime={formatDateTime}
              formatFileSize={formatFileSize}
              isGeneratingAI={generatingAI.has(task.id)}
              setGeneratingAI={setGeneratingAI}
              onUpdateTask={handleUpdateTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AssignmentGradingCard({
  task,
  onGrade,
  formatDateTime,
  formatFileSize,
  isGeneratingAI,
  setGeneratingAI,
  onUpdateTask,
}: {
  task: AssignmentGradingTask;
  onGrade: (taskId: string, score: number, feedback: string) => void;
  formatDateTime: (date: string) => string;
  formatFileSize: (bytes?: number) => string;
  isGeneratingAI: boolean;
  setGeneratingAI: React.Dispatch<React.SetStateAction<Set<string>>>;
  onUpdateTask: (task: AssignmentGradingTask) => void;
}) {
  const [score, setScore] = useState(task.score?.toString() || task.aiScore?.toString() || '');
  const [feedback, setFeedback] = useState(task.feedback || task.aiFeedback || '');
  const [isEditing, setIsEditing] = useState(task.status === 'pending');

  // Update score and feedback when AI feedback is generated or when task changes
  useEffect(() => {
    // If there's AI feedback from DB and task is not graded yet, use AI feedback
    if (task.aiScore !== undefined && task.aiScore !== null && task.aiFeedback && task.aiFeedback.trim() !== '' && isEditing && !task.score) {
      setScore(task.aiScore.toString());
      setFeedback(task.aiFeedback);
    }
    // If task is already graded, use the graded score and feedback
    else if (task.score !== undefined && task.score !== null && task.feedback && task.feedback.trim() !== '') {
      setScore(task.score.toString());
      setFeedback(task.feedback);
    }
    // If there's only AI feedback (from DB), use it
    else if (task.aiScore !== undefined && task.aiScore !== null && task.aiFeedback && task.aiFeedback.trim() !== '') {
      setScore(task.aiScore.toString());
      setFeedback(task.aiFeedback);
    }
  }, [task.aiScore, task.aiFeedback, task.score, task.feedback, isEditing]);

  const handleSubmit = () => {
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > task.maxScore) {
      Swal.fire({
        icon: 'error',
        title: 'คะแนนไม่ถูกต้อง',
        text: `กรุณาระบุคะแนนระหว่าง 0 ถึง ${task.maxScore}`,
      });
      return;
    }

    onGrade(task.id, scoreNum, feedback);
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="flex-shrink-0">
              {task.studentAvatar ? (
                <img
                  src={task.studentAvatar}
                  alt={task.studentName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{task.assignmentTitle}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {task.status === 'pending' ? 'ยังไม่ตรวจ' : 'ตรวจแล้ว'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">นักเรียน:</span> {task.studentName}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">หลักสูตร:</span> {task.courseTitle}
              </p>
              <p className="text-sm text-gray-500">
                ส่งเมื่อ: {formatDateTime(task.submittedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* File Download */}
        {task.fileUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.fileName || 'ไฟล์การบ้าน'}
                  </p>
                  {task.fileSize && (
                    <p className="text-xs text-gray-500">{formatFileSize(task.fileSize)}</p>
                  )}
                </div>
              </div>
              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>ดาวน์โหลด</span>
              </a>
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {isGeneratingAI ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-800 text-sm">กำลังประมวลผลข้อเสนอแนะจาก AI กรุณารอสักครู่...</p>
            </div>
          </div>
        ) : task.aiScore !== undefined && task.aiFeedback ? (
          // Show AI feedback card when AI feedback exists (same style as exam grading page)
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2" />
                คำแนะนำจาก AI:
              </h4>
              <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-sm font-medium">
                คะแนนแนะนำ: {task.aiScore}/{task.maxScore}
              </span>
            </div>
            <p className="text-blue-800 text-sm whitespace-pre-wrap mb-3">{task.aiFeedback}</p>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setGeneratingAI((prev) => new Set(prev).add(task.id));
                  try {
                    Swal.fire({
                      title: 'กำลังสร้างคำแนะนำใหม่จาก AI...',
                      allowOutsideClick: false,
                      didOpen: () => {
                        Swal.showLoading();
                      },
                    });

                    const response = await assignmentGradingApi.regenerateAIFeedback(task.id);
                    
                    if (response.success && response.data) {
                      setScore(response.data.score.toString());
                      setFeedback(response.data.feedback);
                      // Update local state immediately
                      onUpdateTask({
                        ...task,
                        aiScore: response.data.score,
                        aiFeedback: response.data.feedback,
                      });
                      await Swal.fire({
                        icon: 'success',
                        title: 'สร้างคำแนะนำใหม่สำเร็จ!',
                        text: 'ได้รับคำแนะนำใหม่จาก AI แล้ว',
                        timer: 2000,
                        showConfirmButton: false,
                      });
                      // Refresh data to get latest from database
                      // Note: fetchData will be called from parent component
                    } else {
                      throw new Error(response.error || 'ไม่สามารถสร้างคำแนะนำได้');
                    }
                  } catch (error: any) {
                    console.error('Error regenerating AI feedback:', error);
                    Swal.fire({
                      icon: 'error',
                      title: 'เกิดข้อผิดพลาด',
                      text: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้',
                    });
                  } finally {
                    setGeneratingAI((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(task.id);
                      return newSet;
                    });
                  }
                }}
                disabled={isGeneratingAI}
                className="w-full"
              >
                {isGeneratingAI ? 'กำลังสร้าง...' : 'ขอคำแนะนำใหม่จาก AI อีกครั้ง'}
              </Button>
            )}
          </div>
        ) : isEditing && !isGeneratingAI ? (
          // Show generate button when no AI feedback exists
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Button
              variant="outline"
              onClick={async () => {
                setGeneratingAI((prev) => new Set(prev).add(task.id));
                try {
                  Swal.fire({
                    title: 'กำลังสร้างคำแนะนำจาก AI...',
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    },
                  });

                  const response = await assignmentGradingApi.generateAIFeedback({
                    submissionId: task.id, // Add submissionId to save to database
                    assignmentTitle: task.assignmentTitle,
                    assignmentDescription: task.assignmentDescription,
                    maxScore: task.maxScore,
                    studentFileUrl: task.fileUrl,
                    studentS3Key: task.s3Key,
                    studentFileName: task.fileName,
                    teacherFileUrl: task.teacherFileUrl,
                    teacherS3Key: task.teacherS3Key,
                    teacherFileName: task.teacherFileName,
                  });
                  
                  if (response.success && response.data) {
                    setScore(response.data.score.toString());
                    setFeedback(response.data.feedback);
                    // Update local state immediately
                    onUpdateTask({
                      ...task,
                      aiScore: response.data.score,
                      aiFeedback: response.data.feedback,
                    });
                    await Swal.fire({
                      icon: 'success',
                      title: 'สร้างคำแนะนำสำเร็จ!',
                      text: 'ได้รับคำแนะนำจาก AI แล้ว',
                      timer: 2000,
                      showConfirmButton: false,
                    });
                    // Refresh data to get latest from database
                    // Note: fetchData will be called from parent component
                  } else {
                    throw new Error(response.error || 'ไม่สามารถสร้างคำแนะนำได้');
                  }
                } catch (error: any) {
                  console.error('Error generating AI feedback:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้',
                  });
                } finally {
                  setGeneratingAI((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(task.id);
                    return newSet;
                  });
                }
              }}
              disabled={isGeneratingAI}
              className="w-full"
            >
              {isGeneratingAI ? 'กำลังสร้างคำแนะนำจาก AI...' : 'สร้างคำแนะนำจาก AI'}
            </Button>
          </div>
        ) : null}

        {/* Remove fallback button - card should handle all cases */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
            <Button
              variant="outline"
              onClick={async () => {
                setGeneratingAI((prev) => new Set(prev).add(task.id));
                try {
                  Swal.fire({
                    title: 'กำลังสร้างคำแนะนำใหม่จาก AI...',
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    },
                  });

                  const response = await assignmentGradingApi.regenerateAIFeedback(task.id);
                  
                  if (response.success && response.data) {
                    setScore(response.data.score.toString());
                    setFeedback(response.data.feedback);
                    // Update local state immediately
                    onUpdateTask({
                      ...task,
                      aiScore: response.data.score,
                      aiFeedback: response.data.feedback,
                    });
                    await Swal.fire({
                      icon: 'success',
                      title: 'สร้างคำแนะนำใหม่สำเร็จ!',
                      text: 'ได้รับคำแนะนำใหม่จาก AI แล้ว',
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  } else {
                    throw new Error(response.error || 'ไม่สามารถสร้างคำแนะนำได้');
                  }
                } catch (error: any) {
                  console.error('Error regenerating AI feedback:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้',
                  });
                } finally {
                  setGeneratingAI((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(task.id);
                    return newSet;
                  });
                }
              }}
              disabled={isGeneratingAI}
              className="w-full"
            >
              {isGeneratingAI ? 'กำลังสร้าง...' : 'ขอคำแนะนำใหม่จาก AI อีกครั้ง'}
            </Button>
          </div>
        )}

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
                step="0.01"
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
              <span className="text-2xl font-bold text-green-600">
                {task.score}/{task.maxScore}
              </span>
            </div>
            {task.feedback && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                <p className="text-green-800 text-sm whitespace-pre-wrap">{task.feedback}</p>
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

