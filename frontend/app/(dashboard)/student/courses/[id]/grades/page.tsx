'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { gradingApi, type StudentGradeReport } from '@/lib/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface StudentGradesPageProps {
  courseId: string;
}

export default function StudentGradesPage({ courseId }: StudentGradesPageProps) {
  const [loading, setLoading] = useState(true);
  const [gradeReport, setGradeReport] = useState<StudentGradeReport | null>(null);

  useEffect(() => {
    const fetchGradeReport = async () => {
      try {
        setLoading(true);
        const response = await gradingApi.getStudentGradeReport(courseId);
        if (response.success && response.data) {
          setGradeReport(response.data);
        }
      } catch (error) {
        console.error('Error fetching grade report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradeReport();
  }, [courseId]);

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลผลการเรียน...</p>
        </div>
      </Card>
    );
  }

  if (!gradeReport || !gradeReport.systemType) {
    return (
      <Card>
        <div className="text-center py-12">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">ยังไม่มีระบบการให้คะแนนสำหรับหลักสูตรนี้</p>
        </div>
      </Card>
    );
  }

  const { systemType, finalGrade, categories, quizzes, assignments, exams } = gradeReport;

  return (
    <div className="space-y-6">
      {/* Final Grade Summary */}
      {finalGrade && (
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">สรุปผลการเรียน</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">คะแนนรวม</p>
                <p className="text-3xl font-bold text-blue-600">{finalGrade.percentage.toFixed(1)}%</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">ผลการเรียน</p>
                <p className="text-3xl font-bold text-green-600">{finalGrade.grade}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">ระบบการให้คะแนน</p>
                <p className="text-lg font-semibold text-purple-600">
                  {systemType === 'PASS_FAIL' ? 'ผ่าน/ไม่ผ่าน' : 'ระบบเกรด'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grade System: PASS_FAIL */}
      {systemType === 'PASS_FAIL' && (
        <>
          {/* Quizzes */}
          {quizzes.length > 0 && (
            <Card className="shadow-lg border-0">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">แบบทดสอบ</h3>
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          คะแนน: {quiz.score.toFixed(1)} / {quiz.maxScore.toFixed(1)} ({quiz.percentage.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {quiz.passed ? (
                          <>
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            <span className="text-green-600 font-semibold">ผ่าน</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-6 w-6 text-red-600" />
                            <span className="text-red-600 font-semibold">ไม่ผ่าน</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Exams */}
          {exams.length > 0 && (
            <Card className="shadow-lg border-0">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อสอบ</h3>
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{exam.title}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          คะแนน: {exam.score.toFixed(1)} / {exam.maxScore.toFixed(1)} ({exam.percentage.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {exam.passed ? (
                          <>
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
                            <span className="text-green-600 font-semibold">ผ่าน</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-6 w-6 text-red-600" />
                            <span className="text-red-600 font-semibold">ไม่ผ่าน</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Grade System: GRADE */}
      {systemType === 'GRADE' && (
        <>
          {/* Categories */}
          {categories.length > 0 && (
            <Card className="shadow-lg border-0">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">คะแนนแยกตามประเภท</h3>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryLabels: Record<string, string> = {
                      quiz: 'แบบทดสอบ',
                      assignment: 'การบ้าน',
                      midterm: 'สอบกลางภาค',
                      final: 'สอบปลายภาค',
                      exam: 'ข้อสอบ',
                    };

                    return (
                      <div
                        key={category.category}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {categoryLabels[category.category] || category.category}
                          </h4>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {category.percentage.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-600">น้ำหนัก {category.weight}%</p>
                          </div>
                        </div>
                        {category.scores.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              คะแนน: {category.scores.map(s => s.toFixed(1)).join(', ')}
                            </p>
                            <p className="text-sm text-gray-600">
                              เฉลี่ย: {category.average.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Total Percentage */}
          {finalGrade && (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">คะแนนรวม</h3>
                  <p className="text-4xl font-bold text-purple-600">{finalGrade.percentage.toFixed(1)}%</p>
                </div>
                <p className="text-lg font-semibold text-gray-700 mt-2">เกรด: {finalGrade.grade}</p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Assignments */}
      {assignments.length > 0 && (
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">การบ้าน</h3>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{assignment.title}</p>
                    {assignment.status === 'pending' ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <ClockIcon className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">รออาจารย์ผู้สอนตรวจและให้คะแนน</span>
                      </div>
                    ) : assignment.status === 'graded' && assignment.score !== null ? (
                      <p className="text-sm text-gray-600 mt-1">
                        คะแนน: {assignment.score.toFixed(1)} / {assignment.maxScore.toFixed(1)}
                        {assignment.percentage !== null && ` (${assignment.percentage.toFixed(1)}%)`}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">ยังไม่ส่ง</p>
                    )}
                  </div>
                  {assignment.status === 'graded' && assignment.score !== null && (
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

