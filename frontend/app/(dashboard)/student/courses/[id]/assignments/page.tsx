'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { assignmentsApi, coursesApi, uploadApi, type Assignment, type AssignmentSubmission } from '@/lib/api';
import {
  DocumentArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function StudentAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, courseResponse] = await Promise.all([
        assignmentsApi.getByCourse(courseId),
        coursesApi.getById(courseId),
      ]);

      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data);
      }

      if (courseResponse.success) {
        setCourse(courseResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (assignment: Assignment, file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      Swal.fire({
        icon: 'error',
        title: 'ประเภทไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์ PDF, DOC, หรือ DOCX เท่านั้น',
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ใหญ่เกินไป',
        text: 'ขนาดไฟล์ไม่ควรเกิน 50MB',
      });
      return;
    }

    try {
      setSubmittingId(assignment.id);

      // Upload file
      const uploadResponse = await uploadApi.uploadFile(
        file,
        'document',
        (progress) => {
          // Show upload progress
          if (progress < 100) {
            Swal.fire({
              title: 'กำลังอัพโหลด...',
              html: `อัพโหลดไฟล์: ${progress}%`,
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              },
            });
          }
        }
      );

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'ไม่สามารถอัพโหลดไฟล์ได้');
      }

      // Submit assignment
      const submitResponse = await assignmentsApi.submit(assignment.id, {
        fileUrl: uploadResponse.data.url,
        fileName: uploadResponse.data.fileName,
        fileSize: uploadResponse.data.fileSize,
        s3Key: uploadResponse.data.s3Key,
      });

      if (submitResponse.success) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งการบ้านสำเร็จ',
          text: 'ส่งการบ้านสำเร็จแล้ว',
        });
        fetchData();
      } else {
        throw new Error(submitResponse.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งการบ้านได้',
      });
    } finally {
      setSubmittingId(null);
      Swal.close();
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = assignment.submissions?.[0];
    if (!submission) {
      if (isOverdue(assignment.dueDate)) {
        return { status: 'overdue', text: 'หมดเวลาแล้ว', icon: XCircleIcon, color: 'text-red-600' };
      }
      return { status: 'not_submitted', text: 'ยังไม่ได้ส่ง', icon: ClockIcon, color: 'text-gray-600' };
    }
    if (submission.score !== null && submission.score !== undefined) {
      return { status: 'graded', text: `ได้คะแนน: ${submission.score}/${assignment.maxScore}`, icon: CheckCircleIcon, color: 'text-green-600' };
    }
    return { status: 'submitted', text: 'ส่งแล้ว (รอตรวจ)', icon: CheckCircleIcon, color: 'text-blue-600' };
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">การบ้าน</h2>
        <p className="text-gray-600 mt-1">{course?.title}</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีข้อมูลการบ้าน</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const submission = assignment.submissions?.[0];
            const status = getSubmissionStatus(assignment);
            const StatusIcon = status.icon;

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                      <div className={`flex items-center space-x-1 ${status.color}`}>
                        <StatusIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">{status.text}</span>
                      </div>
                    </div>
                    {assignment.description && (
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      {assignment.dueDate && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>กำหนดส่ง: {formatDate(assignment.dueDate)}</span>
                        </div>
                      )}
                      <span>คะแนนเต็ม: {assignment.maxScore} คะแนน</span>
                      {assignment.fileName && (
                        <div className="flex items-center space-x-1">
                          <DocumentArrowUpIcon className="h-4 w-4" />
                          <a
                            href={assignment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            ดาวน์โหลดไฟล์การบ้าน ({formatFileSize(assignment.fileSize)})
                          </a>
                        </div>
                      )}
                    </div>

                    {submission && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">ไฟล์ที่ส่ง:</span>
                          {submission.submittedAt && (
                            <span className="text-xs text-gray-500">
                              ส่งเมื่อ: {formatDate(submission.submittedAt)}
                            </span>
                          )}
                        </div>
                        {submission.fileName && (
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline text-sm"
                          >
                            {submission.fileName} ({formatFileSize(submission.fileSize)})
                          </a>
                        )}
                        {submission.score !== null && submission.score !== undefined && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">คะแนน:</span>
                              <span className="text-lg font-bold text-green-600">
                                {submission.score} / {assignment.maxScore}
                              </span>
                            </div>
                            {submission.feedback && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-700">ความคิดเห็น:</span>
                                <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {!submission && !isOverdue(assignment.dueDate) && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(assignment, file);
                            }
                          }}
                          className="hidden"
                          disabled={submittingId === assignment.id}
                        />
                        <Button
                          disabled={submittingId === assignment.id}
                          className="whitespace-nowrap"
                        >
                          {submittingId === assignment.id ? 'กำลังส่ง...' : 'ส่งการบ้าน'}
                        </Button>
                      </label>
                    )}
                    {submission && !submission.score && submission.score !== 0 && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(assignment, file);
                            }
                          }}
                          className="hidden"
                          disabled={submittingId === assignment.id}
                        />
                        <Button
                          variant="outline"
                          disabled={submittingId === assignment.id}
                          className="whitespace-nowrap"
                        >
                          {submittingId === assignment.id ? 'กำลังส่ง...' : 'ส่งใหม่'}
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

