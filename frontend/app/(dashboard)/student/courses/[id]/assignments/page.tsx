'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { assignmentsApi, coursesApi, uploadApi, type Assignment, type AssignmentSubmission } from '@/lib/api';
import {
  DocumentArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PaperClipIcon,
  XMarkIcon,
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [notificationChecked, setNotificationChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
    
    // Poll for grade updates every 30 seconds
    const interval = setInterval(() => {
      checkForNewGrades();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [courseId]);

  const checkForNewGrades = async () => {
    try {
      const response = await assignmentsApi.getByCourse(courseId);
      if (response.success && response.data) {
        // Check for newly graded assignments
        response.data.forEach((assignment: Assignment) => {
          const submission = assignment.submissions?.[0];
          if (submission && submission.score !== null && submission.score !== undefined) {
            const key = `${assignment.id}-${submission.id}`;
            if (!notificationChecked[key] && submission.gradedAt) {
              // Check if this is a new grade (graded within last 5 minutes)
              const gradedAt = new Date(submission.gradedAt);
              const now = new Date();
              const diffMinutes = (now.getTime() - gradedAt.getTime()) / 1000 / 60;
              
              if (diffMinutes < 5) {
                // Show notification
                Swal.fire({
                  icon: 'success',
                  title: 'ครูให้คะแนนแล้ว!',
                  html: `
                    <div class="text-left">
                      <p class="mb-2"><strong>${assignment.title}</strong></p>
                      <p class="text-lg font-bold text-green-600 mb-2">
                        คะแนน: ${submission.score} / ${assignment.maxScore}
                      </p>
                      ${submission.feedback ? `<p class="text-sm text-gray-600">${submission.feedback}</p>` : ''}
                    </div>
                  `,
                  confirmButtonText: 'ดูรายละเอียด',
                  showCancelButton: true,
                  cancelButtonText: 'ปิด',
                }).then((result) => {
                  if (result.isConfirmed) {
                    // Refresh data to show updated grade
                    fetchData();
                  }
                });
                
                // Mark as checked
                setNotificationChecked(prev => ({ ...prev, [key]: true }));
              }
            }
          }
        });
        
        // Update assignments state
        setAssignments(response.data);
      }
    } catch (error) {
      console.error('Error checking for new grades:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, courseResponse] = await Promise.all([
        assignmentsApi.getByCourse(courseId),
        coursesApi.getById(courseId),
      ]);

      if (assignmentsResponse.success && assignmentsResponse.data) {
        setAssignments(assignmentsResponse.data);
        
        // Initialize notification checked state
        const checked: Record<string, boolean> = {};
        assignmentsResponse.data.forEach((assignment: Assignment) => {
          const submission = assignment.submissions?.[0];
          if (submission && submission.score !== null && submission.score !== undefined) {
            const key = `${assignment.id}-${submission.id}`;
            checked[key] = true; // Mark existing grades as already checked
          }
        });
        setNotificationChecked(checked);
      } else {
        console.error('[ASSIGNMENTS] Failed to fetch assignments:', assignmentsResponse);
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

  const handleFileSelect = (assignmentId: string, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmitAssignment = async (assignment: Assignment) => {
    const file = selectedFiles[assignment.id];
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกไฟล์',
        text: 'กรุณาเลือกไฟล์ก่อนส่งการบ้าน',
      });
      return;
    }

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

    // Confirm submission
    const result = await Swal.fire({
      icon: 'question',
      title: 'ยืนยันการส่งการบ้าน',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>${assignment.title}</strong></p>
          <p class="text-sm text-gray-600 mb-2">ไฟล์: ${file.name}</p>
          <p class="text-sm text-gray-600">ขนาด: ${formatFileSize(file.size)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการส่ง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmittingId(assignment.id);
      setOpenDropdownId(null);

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
          text: 'ส่งการบ้านสำเร็จแล้ว รออาจารย์ตรวจสอบ',
          timer: 2000,
        });
        
        // Clear selected file
        setSelectedFiles(prev => ({ ...prev, [assignment.id]: null }));
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
            const isDropdownOpen = openDropdownId === assignment.id;
            const selectedFile = selectedFiles[assignment.id];

            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                {/* Card Header */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {assignment.dueDate && (
                          <div className={`flex items-center space-x-1 ${isOverdue(assignment.dueDate) ? 'text-red-600' : 'text-gray-600'}`}>
                            <ClockIcon className="h-4 w-4" />
                            <span className={isOverdue(assignment.dueDate) ? 'font-medium' : ''}>
                              กำหนดส่ง: {formatDate(assignment.dueDate)}
                              {isOverdue(assignment.dueDate) && ' (หมดเวลาแล้ว)'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-gray-600">
                          <span className="font-medium">คะแนนเต็ม: {assignment.maxScore} คะแนน</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${status.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-medium">{status.text}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Attachment Section */}
                {assignment.fileName && assignment.fileUrl && (
                  <div className="mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <DocumentArrowUpIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-2">ไฟล์การบ้าน</p>
                          <a
                            href={assignment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 underline text-sm font-medium break-words mb-1"
                            download={assignment.fileName}
                          >
                            <PaperClipIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span className="break-words">{assignment.fileName}</span>
                          </a>
                          {assignment.fileSize && (
                            <p className="text-xs text-gray-500 mt-1">
                              ขนาด: {formatFileSize(assignment.fileSize)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submission Section */}
                {submission && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">ไฟล์ที่ส่ง</h4>
                      {submission.submittedAt && (
                        <span className="text-xs text-gray-500">
                          ส่งเมื่อ: {formatDate(submission.submittedAt)}
                        </span>
                      )}
                    </div>
                    {submission.fileName && submission.fileUrl ? (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 mb-3">
                        <div className="flex items-start space-x-3">
                          <DocumentArrowUpIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-700 underline text-sm font-medium break-words"
                              download={submission.fileName}
                            >
                              <PaperClipIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                              <span className="break-words">{submission.fileName}</span>
                            </a>
                            {submission.fileSize && (
                              <p className="text-xs text-gray-500 mt-2">
                                ขนาด: {formatFileSize(submission.fileSize)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {submission.score !== null && submission.score !== undefined && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">คะแนน:</span>
                          <span className="text-xl font-bold text-green-600">
                            {submission.score} / {assignment.maxScore}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${(submission.score / assignment.maxScore) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-sm font-medium text-gray-700 block mb-1">ความคิดเห็นจากอาจารย์:</span>
                            <p className="text-sm text-gray-700">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button Section */}
                {!submission && !isOverdue(assignment.dueDate) && (
                  <div className="mt-4">
                    <div className="relative">
                      <Button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : assignment.id)}
                        disabled={submittingId === assignment.id}
                        className="w-full flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                          ส่งการบ้าน
                        </span>
                        {isDropdownOpen ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </Button>

                      {isDropdownOpen && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                เลือกไฟล์
                              </label>
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[assignment.id] = el;
                                }}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  handleFileSelect(assignment.id, file || null);
                                }}
                                className="hidden"
                              />
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => fileInputRefs.current[assignment.id]?.click()}
                                  className="flex-1"
                                >
                                  <PaperClipIcon className="h-4 w-4 mr-2" />
                                  {selectedFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                                </Button>
                                {selectedFile && (
                                  <button
                                    onClick={() => handleFileSelect(assignment.id, null)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                              {selectedFile && (
                                <div className="mt-2 p-2 bg-white rounded border border-gray-300">
                                  <div className="flex items-center space-x-2">
                                    <PaperClipIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleSubmitAssignment(assignment)}
                              disabled={!selectedFile || submittingId === assignment.id}
                              className="w-full"
                            >
                              {submittingId === assignment.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                  กำลังส่ง...
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                                  ยืนยันการส่ง
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {submission && submission.score === null && submission.score !== 0 && !isOverdue(assignment.dueDate) && (
                  <div className="mt-4">
                    <div className="relative">
                      <Button
                        onClick={() => setOpenDropdownId(isDropdownOpen ? null : assignment.id)}
                        disabled={submittingId === assignment.id}
                        variant="outline"
                        className="w-full flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                          ส่งใหม่
                        </span>
                        {isDropdownOpen ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </Button>

                      {isDropdownOpen && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                เลือกไฟล์ใหม่
                              </label>
                              <input
                                ref={(el) => {
                                  fileInputRefs.current[assignment.id] = el;
                                }}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  handleFileSelect(assignment.id, file || null);
                                }}
                                className="hidden"
                              />
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => fileInputRefs.current[assignment.id]?.click()}
                                  className="flex-1"
                                >
                                  <PaperClipIcon className="h-4 w-4 mr-2" />
                                  {selectedFile ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
                                </Button>
                                {selectedFile && (
                                  <button
                                    onClick={() => handleFileSelect(assignment.id, null)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <XMarkIcon className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                              {selectedFile && (
                                <div className="mt-2 p-2 bg-white rounded border border-gray-300">
                                  <div className="flex items-center space-x-2">
                                    <PaperClipIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 flex-1 truncate">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleSubmitAssignment(assignment)}
                              disabled={!selectedFile || submittingId === assignment.id}
                              className="w-full"
                            >
                              {submittingId === assignment.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                  กำลังส่ง...
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                                  ยืนยันการส่ง
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isOverdue(assignment.dueDate) && !submission && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                    <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 font-medium">หมดเวลาส่งการบ้านแล้ว</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

