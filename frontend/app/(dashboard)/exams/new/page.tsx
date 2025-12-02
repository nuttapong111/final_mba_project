'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import {
  mockCourses,
  mockQuestionBank,
  mockQuestionCategories,
  getQuestionsByCategory,
  type ExamQuestionSelection,
} from '@/lib/mockData';
import { examsApi, coursesApi } from '@/lib/api';

export default function NewExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    type: 'QUIZ' as 'QUIZ' | 'MIDTERM' | 'FINAL',
    duration: '',
    totalScore: '',
    passingScore: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });

  const [useRandomQuestions, setUseRandomQuestions] = useState(true);
  const [questionSelections, setQuestionSelections] = useState<ExamQuestionSelection[]>([]);

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await coursesApi.getAll();
        if (response.success && response.data) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadCourses();
  }, []);

  const handleAddQuestionSelection = () => {
    if (!formData.courseId) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกหลักสูตร',
        text: 'คุณต้องเลือกหลักสูตรก่อนเพิ่มหมวดหมู่ข้อสอบ',
      });
      return;
    }

    const availableCategories = mockQuestionCategories.filter(
      cat => cat.courseId === formData.courseId || !cat.courseId
    );

    if (availableCategories.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่มีหมวดหมู่',
        text: 'หลักสูตรนี้ยังไม่มีหมวดหมู่ข้อสอบ',
      });
      return;
    }

    // ตรวจสอบว่ามีหมวดหมู่ที่ยังไม่ได้เลือกหรือไม่
    const selectedCategoryIds = questionSelections.map(qs => qs.categoryId);
    const unselectedCategories = availableCategories.filter(
      cat => !selectedCategoryIds.includes(cat.id)
    );

    if (unselectedCategories.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'เพิ่มครบแล้ว',
        text: 'คุณได้เพิ่มหมวดหมู่ทั้งหมดแล้ว',
      });
      return;
    }

    // เพิ่มหมวดหมู่แรกที่ยังไม่ได้เลือก
    const newSelection: ExamQuestionSelection = {
      categoryId: unselectedCategories[0].id,
      categoryName: unselectedCategories[0].name,
      questionCount: 5,
    };
    setQuestionSelections([...questionSelections, newSelection]);
  };

  const handleUpdateQuestionSelection = (
    index: number,
    field: keyof ExamQuestionSelection,
    value: any
  ) => {
    const updated = [...questionSelections];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionSelections(updated);
  };

  const handleRemoveQuestionSelection = (index: number) => {
    setQuestionSelections(questionSelections.filter((_, i) => i !== index));
  };

  const getAvailableCategories = () => {
    if (!formData.courseId) return [];
    return mockQuestionCategories.filter(
      cat => cat.courseId === formData.courseId || !cat.courseId
    );
  };

  const getTotalQuestions = () => {
    return questionSelections.reduce((sum, qs) => sum + qs.questionCount, 0);
  };

  const getAvailableQuestionsCount = (categoryId: string, difficulty?: string) => {
    const questions = getQuestionsByCategory(categoryId);
    if (difficulty) {
      return questions.filter(q => q.difficulty === difficulty).length;
    }
    return questions.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseId) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเลือกหลักสูตร',
      });
      return;
    }

    if (useRandomQuestions && questionSelections.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเพิ่มหมวดหมู่ข้อสอบ',
        text: 'คุณต้องเพิ่มหมวดหมู่ข้อสอบอย่างน้อย 1 หมวดหมู่',
      });
      return;
    }

    if (useRandomQuestions) {
      // ตรวจสอบว่ามีข้อสอบเพียงพอหรือไม่
      for (const selection of questionSelections) {
        const available = getAvailableQuestionsCount(
          selection.categoryId,
          selection.difficulty
        );
        if (available < selection.questionCount) {
          Swal.fire({
            icon: 'error',
            title: 'ข้อสอบไม่เพียงพอ',
            text: `หมวดหมู่ "${selection.categoryName}" มีข้อสอบเพียง ${available} ข้อ แต่ต้องการ ${selection.questionCount} ข้อ`,
          });
          return;
        }
      }
    }

    try {
      setLoading(true);

      const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
      const endDateTime = `${formData.endDate}T${formData.endTime}:00`;

      const response = await examsApi.create({
        courseId: formData.courseId,
        title: formData.title,
        type: formData.type,
        duration: parseInt(formData.duration),
        totalQuestions: getTotalQuestions(),
        totalScore: parseInt(formData.totalScore),
        passingScore: parseInt(formData.passingScore),
        startDate: startDateTime,
        endDate: endDateTime,
        useRandomQuestions,
        questionSelections: useRandomQuestions ? questionSelections.map(s => ({
          categoryId: s.categoryId,
          categoryName: s.categoryName,
          questionCount: s.questionCount,
          difficulty: s.difficulty ? s.difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD' : undefined,
        })) : undefined,
      });

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สร้างข้อสอบสำเร็จ!',
          text: 'ข้อสอบถูกสร้างเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });

        router.push('/exams');
      } else {
        throw new Error(response.error || 'ไม่สามารถสร้างข้อสอบได้');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถสร้างข้อสอบได้',
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">สร้างข้อสอบใหม่</h1>
          <p className="text-gray-600 mt-1">สร้างข้อสอบและเลือกข้อสอบจากคลังข้อสอบ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลข้อสอบ</h2>
              <div className="space-y-4">
                <Input
                  label="ชื่อข้อสอบ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น สอบกลางภาค คณิตศาสตร์ ม.4"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    หลักสูตร
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">เลือกหลักสูตร</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ประเภทข้อสอบ *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'QUIZ' | 'MIDTERM' | 'FINAL' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem',
                    }}
                    required
                  >
                    <option value="">-- เลือกประเภทข้อสอบ --</option>
                    <option value="QUIZ">แบบทดสอบ (Quiz)</option>
                    <option value="MIDTERM">สอบกลางภาค (Midterm)</option>
                    <option value="FINAL">สอบปลายภาค (Final)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    เลือกประเภทข้อสอบที่ต้องการสร้าง
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ระยะเวลา (นาที)"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="90"
                    required
                  />
                  <Input
                    label="คะแนนเต็ม"
                    type="number"
                    value={formData.totalScore}
                    onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
                    placeholder="100"
                    required
                  />
                </div>
                <Input
                  label="คะแนนผ่าน (คะแนน)"
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
            </Card>

            {/* Schedule */}
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">กำหนดการสอบ</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    วันที่เริ่มสอบ
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    เวลาเริ่มสอบ
                  </label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    วันที่สิ้นสุด
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    เวลาสิ้นสุด
                  </label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Question Selection */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">การเลือกข้อสอบ</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="random-questions"
                    checked={useRandomQuestions}
                    onChange={() => setUseRandomQuestions(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="random-questions" className="text-sm font-medium text-gray-700">
                    สุ่มข้อสอบจากคลังข้อสอบ
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="manual-questions"
                    checked={!useRandomQuestions}
                    onChange={() => setUseRandomQuestions(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="manual-questions" className="text-sm font-medium text-gray-700">
                    เลือกข้อสอบด้วยตนเอง
                  </label>
                </div>

                {useRandomQuestions && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        จำนวนข้อสอบทั้งหมด: <span className="font-bold text-gray-900">{getTotalQuestions()}</span> ข้อ
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddQuestionSelection}
                        disabled={!formData.courseId}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        เพิ่มหมวดหมู่
                      </Button>
                    </div>

                    {questionSelections.map((selection, index) => {
                      const availableCategories = getAvailableCategories();
                      const availableCount = getAvailableQuestionsCount(selection.categoryId);

                      return (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">
                              หมวดหมู่ {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionSelection(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                หมวดหมู่
                              </label>
                              <select
                                value={selection.categoryId}
                                onChange={(e) => {
                                  const category = availableCategories.find(c => c.id === e.target.value);
                                  handleUpdateQuestionSelection(index, 'categoryId', e.target.value);
                                  if (category) {
                                    handleUpdateQuestionSelection(index, 'categoryName', category.name);
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              >
                                {availableCategories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.questionCount} ข้อ)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  จำนวนข้อสอบ
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={availableCount}
                                  value={selection.questionCount}
                                  onChange={(e) => {
                                    const count = parseInt(e.target.value) || 0;
                                    if (count <= availableCount) {
                                      handleUpdateQuestionSelection(index, 'questionCount', count);
                                    }
                                  }}
                                  required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  มีข้อสอบ {availableCount} ข้อ
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  ระดับความยาก (ไม่บังคับ)
                                </label>
                                <select
                                  value={selection.difficulty || ''}
                                  onChange={(e) => {
                                    handleUpdateQuestionSelection(
                                      index,
                                      'difficulty',
                                      e.target.value || undefined
                                    );
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                  <option value="">ทุกระดับ</option>
                                  <option value="easy">ง่าย</option>
                                  <option value="medium">ปานกลาง</option>
                                  <option value="hard">ยาก</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {questionSelections.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>ยังไม่มีหมวดหมู่ข้อสอบ คลิกปุ่ม "เพิ่มหมวดหมู่" เพื่อเพิ่ม</p>
                      </div>
                    )}
                  </div>
                )}

                {!useRandomQuestions && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      ฟีเจอร์เลือกข้อสอบด้วยตนเองจะพร้อมใช้งานในเร็วๆ นี้
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• เลือกหลักสูตรก่อนเพิ่มหมวดหมู่ข้อสอบ</li>
                <li>• สามารถเพิ่มหลายหมวดหมู่และกำหนดจำนวนข้อสอบในแต่ละหมวดหมู่</li>
                <li>• ระบบจะสุ่มข้อสอบจากหมวดหมู่ที่เลือกอัตโนมัติ</li>
                <li>• สามารถกำหนดระดับความยากของข้อสอบได้</li>
                <li>• ตรวจสอบให้แน่ใจว่ามีข้อสอบเพียงพอในแต่ละหมวดหมู่</li>
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
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5 mr-2 inline" />
                    สร้างข้อสอบ
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

