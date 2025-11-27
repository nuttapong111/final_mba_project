'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import {
  mockCourses,
  getCourseWithLessons,
  type CourseCompletionRequirements,
  type QuizPassingRequirement,
} from '@/lib/mockData';

export default function CourseCompletionSettingsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const course = mockCourses.find(c => c.id === courseId);
  const courseWithLessons = getCourseWithLessons(courseId);

  // ดึง quiz ทั้งหมดจาก lessons
  const getAllQuizzes = () => {
    if (!courseWithLessons?.lessons) return [];
    const quizzes: Array<{ id: string; title: string; lessonTitle: string }> = [];
    
    courseWithLessons.lessons.forEach((lesson) => {
      lesson.contents.forEach((content) => {
        if (content.type === 'quiz' || content.type === 'pre_test') {
          quizzes.push({
            id: content.id,
            title: content.title || (content.type === 'pre_test' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบ'),
            lessonTitle: lesson.title,
          });
        }
      });
    });
    
    return quizzes;
  };

  const allQuizzes = getAllQuizzes();

  // ใช้ useMemo เพื่อป้องกันการสร้าง array ใหม่ทุกครั้ง
  const quizIdsString = allQuizzes.map(q => q.id).join(',');

  const [requirements, setRequirements] = useState<CourseCompletionRequirements>({
    requireProgress: true,
    minProgressPercentage: 100,
    requireAllQuizzes: false,
    minQuizPassingPercentage: 70,
    quizRequirements: allQuizzes.map(quiz => ({
      quizId: quiz.id,
      quizTitle: quiz.title,
      passingPercentage: 70,
      required: true,
    })),
  });

  useEffect(() => {
    // โหลดข้อมูลจาก course ถ้ามี
    if (course?.completionRequirements) {
      const existingReqs = course.completionRequirements;
      
      // Sync quiz requirements กับ quizzes ที่มีอยู่จริง
      const existingQuizIds = existingReqs.quizRequirements?.map(q => q.quizId) || [];
      const currentQuizIds = allQuizzes.map(q => q.id);
      
      // เพิ่ม quiz ใหม่ที่ยังไม่มีใน requirements
      const newQuizReqs = allQuizzes
        .filter(q => !existingQuizIds.includes(q.id))
        .map(quiz => ({
          quizId: quiz.id,
          quizTitle: quiz.title,
          passingPercentage: existingReqs.minQuizPassingPercentage || 70,
          required: true,
        }));
      
      // รวม quiz requirements ที่มีอยู่และใหม่
      const updatedQuizReqs = [
        ...(existingReqs.quizRequirements || []).filter(q => currentQuizIds.includes(q.quizId)),
        ...newQuizReqs,
      ];
      
      setRequirements({
        ...existingReqs,
        quizRequirements: updatedQuizReqs,
      });
    } else {
      // สร้าง default requirements
      setRequirements({
        requireProgress: true,
        minProgressPercentage: 100,
        requireAllQuizzes: false,
        minQuizPassingPercentage: 70,
        quizRequirements: allQuizzes.map(quiz => ({
          quizId: quiz.id,
          quizTitle: quiz.title,
          passingPercentage: 70,
          required: true,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, quizIdsString]);

  const handleUpdateRequirement = (field: keyof CourseCompletionRequirements, value: any) => {
    setRequirements({ ...requirements, [field]: value });
  };

  const handleUpdateQuizRequirement = (
    index: number,
    field: keyof QuizPassingRequirement,
    value: any
  ) => {
    const updated = [...(requirements.quizRequirements || [])];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements({ ...requirements, quizRequirements: updated });
  };

  const handleToggleQuizRequired = (index: number) => {
    const updated = [...(requirements.quizRequirements || [])];
    updated[index] = { ...updated[index], required: !updated[index].required };
    setRequirements({ ...requirements, quizRequirements: updated });
  };

  const handleSave = async () => {
    // Validate
    if (requirements.requireProgress && !requirements.minProgressPercentage) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาระบุเปอร์เซ็นต์การเรียน/เข้าเรียน',
        text: 'คุณต้องระบุเปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน',
      });
      return;
    }

    if (!requirements.requireAllQuizzes && !requirements.minQuizPassingPercentage) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาระบุเปอร์เซ็นต์การผ่านบททดสอบ',
        text: 'คุณต้องระบุเปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ',
      });
      return;
    }

    await Swal.fire({
      icon: 'success',
      title: 'บันทึกสำเร็จ!',
      text: 'เงื่อนไขการจบหลักสูตรถูกบันทึกเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });

    router.push(`/school/courses/${courseId}`);
  };

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบหลักสูตร</p>
        <Button onClick={() => router.push('/school/courses')} className="mt-4">
          กลับไปหน้าหลักสูตร
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ตั้งเงื่อนไขการจบหลักสูตร</h2>
        <p className="text-gray-600 mt-1">{course.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress/Attendance Requirement */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการเรียน/เข้าเรียน</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireProgress"
                    checked={requirements.requireProgress || false}
                    onChange={(e) => {
                      handleUpdateRequirement('requireProgress', e.target.checked);
                      if (!e.target.checked) {
                        handleUpdateRequirement('minProgressPercentage', undefined);
                      } else if (!requirements.minProgressPercentage) {
                        handleUpdateRequirement('minProgressPercentage', 100);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireProgress" className="text-sm font-medium text-gray-700">
                    กำหนดเงื่อนไขการเรียน/เข้าเรียน
                  </label>
                </div>

                {requirements.requireProgress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องเรียน/เข้าเรียน
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={requirements.minProgressPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleUpdateRequirement('minProgressPercentage', value);
                          }
                        }}
                        placeholder="เช่น 80"
                        required={requirements.requireProgress}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      นักเรียนต้องเรียน/เข้าเรียนอย่างน้อย {requirements.minProgressPercentage || 0}% ของหลักสูตร
                    </p>
                    <p className="text-xs text-gray-400 mt-2 italic">
                      * คำนวณจาก: (จำนวน content ที่ดูจนจบหรือคลิกเข้าไปดู + การสอบที่สอบผ่าน) / จำนวน content ทั้งหมด
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Quiz Requirements - General */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการผ่านบททดสอบ (ทั่วไป)</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireAllQuizzes"
                    checked={requirements.requireAllQuizzes}
                    onChange={(e) => {
                      handleUpdateRequirement('requireAllQuizzes', e.target.checked);
                      if (e.target.checked) {
                        handleUpdateRequirement('minQuizPassingPercentage', undefined);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireAllQuizzes" className="text-sm font-medium text-gray-700">
                    ต้องผ่านทุกบททดสอบ
                  </label>
                </div>

                {!requirements.requireAllQuizzes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      เปอร์เซ็นต์ขั้นต่ำที่ต้องผ่านบททดสอบ
                    </label>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={requirements.minQuizPassingPercentage || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleUpdateRequirement('minQuizPassingPercentage', value);
                          }
                        }}
                        placeholder="เช่น 70"
                        required={!requirements.requireAllQuizzes}
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      นักเรียนต้องผ่านบททดสอบโดยเฉลี่ยอย่างน้อย {requirements.minQuizPassingPercentage || 0}%
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Individual Quiz Requirements */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการผ่านแต่ละบททดสอบ</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>คำแนะนำ:</strong> คุณสามารถตั้งค่าเปอร์เซ็นต์การผ่านแยกแต่ละบททดสอบได้ 
                  บททดสอบที่ไม่ได้เลือก "จำเป็นต้องผ่าน" จะไม่บังคับให้ผ่าน
                </p>
              </div>

              {allQuizzes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>ยังไม่มีบททดสอบในหลักสูตรนี้</p>
                  <p className="text-sm mt-2">เพิ่มบททดสอบในหน้า "จัดการเนื้อหาหลักสูตร"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.quizRequirements?.map((quizReq, index) => {
                    const quiz = allQuizzes.find(q => q.id === quizReq.quizId);
                    if (!quiz) return null;

                    return (
                      <div key={quizReq.quizId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                            <p className="text-sm text-gray-500">{quiz.lessonTitle}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={quizReq.required}
                                onChange={() => handleToggleQuizRequired(index)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">จำเป็นต้องผ่าน</span>
                            </label>
                          </div>
                        </div>

                        {quizReq.required && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              เปอร์เซ็นต์ที่ต้องผ่าน
                            </label>
                            <div className="flex items-center space-x-3">
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={quizReq.passingPercentage}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= 1 && value <= 100) {
                                    handleUpdateQuizRequirement(index, 'passingPercentage', value);
                                  }
                                }}
                                required={quizReq.required}
                              />
                              <span className="text-gray-600">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ต้องได้คะแนนอย่างน้อย {quizReq.passingPercentage}% ในการทำบททดสอบนี้
                            </p>
                          </div>
                        )}

                        {!quizReq.required && (
                          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              บททดสอบนี้ไม่จำเป็นต้องผ่าน แต่คะแนนจะถูกนำไปคำนวณในเกณฑ์ทั่วไป
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">สรุปเงื่อนไข</h2>
              <div className="space-y-3 text-sm">
                {requirements.requireProgress && (
                  <div className="flex items-start space-x-2">
                    <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">การเรียน/เข้าเรียน</p>
                      <p className="text-gray-600">
                        ต้องเรียน/เข้าเรียนอย่างน้อย {requirements.minProgressPercentage || 0}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1 italic">
                        (content ที่ดูจนจบ + การสอบที่ผ่าน) / content ทั้งหมด
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">บททดสอบ</p>
                    <p className="text-gray-600">
                      {requirements.requireAllQuizzes
                        ? 'ต้องผ่านทุกบททดสอบ'
                        : `ต้องผ่านโดยเฉลี่ยอย่างน้อย ${requirements.minQuizPassingPercentage || 0}%`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">บททดสอบที่ต้องผ่าน</p>
                    <p className="text-gray-600">
                      {requirements.quizRequirements?.filter(q => q.required).length || 0} จาก{' '}
                      {requirements.quizRequirements?.length || 0} บททดสอบ
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ตั้งค่าเปอร์เซ็นต์การเรียน/เข้าเรียนตามความเหมาะสม</li>
                <li>• คำนวณจาก: (content ที่ดูจนจบหรือคลิกเข้าไปดู + การสอบที่สอบผ่าน) / content ทั้งหมด</li>
                <li>• สามารถตั้งค่าเปอร์เซ็นต์การผ่านแยกแต่ละบททดสอบได้</li>
                <li>• บททดสอบที่ไม่ได้เลือก "จำเป็นต้องผ่าน" จะไม่บังคับ</li>
                <li>• ระบบจะตรวจสอบเงื่อนไขทั้งหมดเมื่อนักเรียนเรียนจบหลักสูตร</li>
              </ul>
            </Card>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
              <Button type="button" className="flex-1" onClick={handleSave}>
                <CheckIcon className="h-5 w-5 mr-2 inline" />
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
}

