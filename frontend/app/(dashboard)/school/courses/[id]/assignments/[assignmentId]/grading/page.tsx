'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { assignmentsApi, coursesApi, type Assignment, type AssignmentSubmission } from '@/lib/api';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function AssignmentGradingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const [course, setCourse] = useState<any>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [courseId, assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentResponse, courseResponse] = await Promise.all([
        assignmentsApi.getById(assignmentId),
        coursesApi.getById(courseId),
      ]);

      if (assignmentResponse.success) {
        setAssignment(assignmentResponse.data);
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

  const handleGrade = (submission: AssignmentSubmission) => {
    setGradingSubmission(submission);
    // Use AI score/feedback if available and not yet graded
    if (!submission.score && submission.aiScore !== undefined && submission.aiFeedback) {
      setScore(submission.aiScore);
      setFeedback(submission.aiFeedback);
    } else {
      setScore(submission.score || 0);
      setFeedback(submission.feedback || '');
    }
  };

  const handleSubmitGrade = async () => {
    if (!gradingSubmission) return;

    if (score < 0 || score > (assignment?.maxScore || 100)) {
      Swal.fire({
        icon: 'error',
        title: 'คะแนนไม่ถูกต้อง',
        text: `คะแนนต้องอยู่ระหว่าง 0 ถึง ${assignment?.maxScore || 100}`,
      });
      return;
    }

    try {
      const response = await assignmentsApi.grade(gradingSubmission.id, {
        score,
        feedback: feedback || undefined,
      });

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'ให้คะแนนสำเร็จ',
          text: 'บันทึกคะแนนและความคิดเห็นเรียบร้อยแล้ว',
        });
        setGradingSubmission(null);
        fetchData();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถบันทึกคะแนนได้',
      });
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

  if (!assignment) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">ไม่พบข้อมูลการบ้าน</p>
          <Button onClick={() => router.back()} className="mt-4">
            กลับ
          </Button>
        </div>
      </Card>
    );
  }

  const submissions = assignment.submissions || [];
  const ungradedSubmissions = submissions.filter((s) => s.score === null || s.score === undefined);
  const gradedSubmissions = submissions.filter((s) => s.score !== null && s.score !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ให้คะแนนการบ้าน</h2>
          <p className="text-gray-600 mt-1">{assignment.title}</p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
            <div className="text-sm text-gray-600 mt-1">ส่งทั้งหมด</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{ungradedSubmissions.length}</div>
            <div className="text-sm text-gray-600 mt-1">รอตรวจ</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{gradedSubmissions.length}</div>
            <div className="text-sm text-gray-600 mt-1">ตรวจแล้ว</div>
          </div>
        </div>
      </Card>

      {/* Ungraded Submissions */}
      {ungradedSubmissions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            รายการที่รอตรวจ ({ungradedSubmissions.length})
          </h3>
          <div className="space-y-4">
            {ungradedSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {submission.student?.name || 'นักเรียน'}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {submission.student?.email}
                      </span>
                    </div>
                    {submission.submittedAt && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                        <ClockIcon className="h-4 w-4" />
                        <span>ส่งเมื่อ: {formatDate(submission.submittedAt)}</span>
                      </div>
                    )}
                    {submission.fileName && (
                      <div className="flex items-center space-x-2 mb-3">
                        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {submission.fileName} ({formatFileSize(submission.fileSize)})
                        </a>
                      </div>
                    )}
                    {/* AI Feedback Preview */}
                    {submission.aiScore !== undefined && submission.aiFeedback && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-blue-900 text-sm flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            คำแนะนำจาก AI:
                          </h5>
                          <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs font-medium">
                            {submission.aiScore}/{assignment.maxScore}
                          </span>
                        </div>
                        <p className="text-blue-800 text-xs line-clamp-2">{submission.aiFeedback}</p>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => handleGrade(submission)}>
                    ให้คะแนน
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Graded Submissions */}
      {gradedSubmissions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            รายการที่ตรวจแล้ว ({gradedSubmissions.length})
          </h3>
          <div className="space-y-4">
            {gradedSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {submission.student?.name || 'นักเรียน'}
                      </h4>
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="font-semibold">
                          {submission.score} / {assignment.maxScore}
                        </span>
                      </div>
                    </div>
                    {submission.submittedAt && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>ส่งเมื่อ: {formatDate(submission.submittedAt)}</span>
                      </div>
                    )}
                    {submission.gradedAt && (
                      <div className="text-sm text-gray-600 mb-3">
                        ตรวจเมื่อ: {formatDate(submission.gradedAt)}
                      </div>
                    )}
                    {submission.fileName && (
                      <div className="flex items-center space-x-2 mb-3">
                        <DocumentArrowUpIcon className="h-5 w-5 text-gray-400" />
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {submission.fileName} ({formatFileSize(submission.fileSize)})
                        </a>
                      </div>
                    )}
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">ความคิดเห็น:</span>
                        <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => handleGrade(submission)}>
                    แก้ไขคะแนน
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                ให้คะแนน: {gradingSubmission.student?.name || 'นักเรียน'}
              </h3>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {gradingSubmission.fileName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ไฟล์ที่ส่ง
                  </label>
                  <a
                    href={gradingSubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {gradingSubmission.fileName} ({formatFileSize(gradingSubmission.fileSize)})
                  </a>
                </div>
              )}

              {/* AI Feedback */}
              {gradingSubmission.aiScore !== undefined && gradingSubmission.aiFeedback && !gradingSubmission.score && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      คำแนะนำจาก AI:
                    </h4>
                    <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-sm font-medium">
                      คะแนนแนะนำ: {gradingSubmission.aiScore}/{assignment.maxScore}
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm whitespace-pre-wrap">{gradingSubmission.aiFeedback}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คะแนน (0 - {assignment.maxScore}) *
                </label>
                <Input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                  min="0"
                  max={assignment.maxScore}
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ความคิดเห็น
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="กรอกความคิดเห็นสำหรับนักเรียน..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setGradingSubmission(null)}
                >
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmitGrade}>
                  บันทึกคะแนน
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

