'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { coursesApi, questionBanksApi } from '@/lib/api';
import type { Question, QuestionOption } from '@/lib/mockData';

export default function NewQuestionPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [questionBank, setQuestionBank] = useState<any>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    question: '',
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer' | 'essay',
    category: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    points: 2,
    explanation: '',
  });

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (availableCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: availableCategories[0]?.id || '' }));
    }
  }, [availableCategories]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, questionBankResponse] = await Promise.all([
        coursesApi.getById(courseId),
        questionBanksApi.getByCourse(courseId),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
      }

      if (questionBankResponse.success && questionBankResponse.data) {
        setQuestionBank(questionBankResponse.data);
        setAvailableCategories(
          questionBankResponse.data.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            questionCount: cat._count?.questions || 0,
            createdAt: cat.createdAt,
          }))
        );
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

  const [options, setOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false },
    { id: '3', text: '', isCorrect: false },
    { id: '4', text: '', isCorrect: false },
  ]);

  const [correctAnswer, setCorrectAnswer] = useState('');

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'ไม่สามารถลบได้',
        text: 'ต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก',
      });
    }
  };

  const handleUpdateOption = (id: string, field: 'text' | 'isCorrect', value: any) => {
    const updated = options.map(opt => {
      if (opt.id === id) {
        if (field === 'isCorrect' && value) {
          // ถ้าเลือกตัวเลือกนี้เป็นคำตอบที่ถูกต้อง ให้ยกเลิกตัวเลือกอื่น
          return { ...opt, isCorrect: true };
        }
        return { ...opt, [field]: value };
      }
      // ถ้าเลือกตัวเลือกใหม่เป็นคำตอบที่ถูกต้อง ให้ยกเลิกตัวเลือกอื่น
      if (field === 'isCorrect' && value) {
        return { ...opt, isCorrect: false };
      }
      return opt;
    });
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกคำถาม',
      });
      return;
    }

    if (!formData.category) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเลือกหมวดหมู่',
      });
      return;
    }

    if ((formData.type === 'multiple_choice' || formData.type === 'true_false') && !options.some(opt => opt.isCorrect)) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเลือกคำตอบที่ถูกต้อง',
        text: 'ต้องมีตัวเลือกอย่างน้อย 1 ตัวเลือกที่ถูกต้อง',
      });
      return;
    }

    if ((formData.type === 'multiple_choice' || formData.type === 'true_false') && options.some(opt => !opt.text.trim())) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกตัวเลือกให้ครบ',
      });
      return;
    }

    // สำหรับ essay questions ไม่ต้องระบุคำตอบที่ถูกต้อง (จะใช้ AI ตรวจ)
    if (formData.type === 'short_answer' && !correctAnswer.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกคำตอบที่ถูกต้อง',
      });
      return;
    }
    
    // สำหรับ essay questions แจ้งเตือนว่าต้องใช้ AI ตรวจ
    if (formData.type === 'essay' && !correctAnswer.trim()) {
      const result = await Swal.fire({
        icon: 'info',
        title: 'ข้อสอบอัตนัย',
        text: 'ข้อสอบอัตนัยจะใช้ AI ตรวจสอบและให้อาจารย์ตรวจสอบอีกครั้ง คุณต้องการดำเนินการต่อหรือไม่?',
        showCancelButton: true,
        confirmButtonText: 'ดำเนินการต่อ',
        cancelButtonText: 'ยกเลิก',
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      if (!questionBank?.id) {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่พบคลังข้อสอบ',
        });
        return;
      }

      // Prepare question data
      const questionData: any = {
        question: formData.question.trim(),
        type: formData.type,
        categoryId: formData.category || undefined,
        difficulty: formData.difficulty,
        points: formData.points,
        explanation: formData.explanation?.trim() || undefined,
      };

      // Add options for multiple choice and true/false
      if (formData.type === 'multiple_choice' || formData.type === 'true_false') {
        questionData.options = options
          .filter(opt => opt.text.trim())
          .map((opt, index) => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect,
            order: index + 1,
          }));
      }

      // Add correct answer for short_answer (essay ไม่ต้องระบุ)
      if (formData.type === 'short_answer' && correctAnswer.trim()) {
        questionData.correctAnswer = correctAnswer.trim();
      }

      const response = await questionBanksApi.createQuestion(questionBank.id, questionData);

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'เพิ่มข้อสอบสำเร็จ!',
          text: 'ข้อสอบถูกเพิ่มเข้าไปในคลังข้อสอบเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });

        router.push(`/school/courses/${courseId}/question-bank`);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถเพิ่มข้อสอบได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถเพิ่มข้อสอบได้',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">ไม่พบหลักสูตร</p>
            <Button onClick={() => router.back()} className="mt-4">
              กลับ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900">เพิ่มข้อสอบใหม่</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลข้อสอบ</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คำถาม *
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="กรอกคำถาม..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ประเภทข้อสอบ *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        const newType = e.target.value as Question['type'];
                        setFormData({ ...formData, type: newType });
                        if (newType === 'true_false') {
                          setOptions([
                            { id: '1', text: 'ถูก', isCorrect: false },
                            { id: '2', text: 'ผิด', isCorrect: false },
                          ]);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="multiple_choice">ตัวเลือก (Multiple Choice)</option>
                      <option value="true_false">ถูก/ผิด (True/False)</option>
                      <option value="short_answer">คำตอบสั้น (Short Answer)</option>
                      <option value="essay">เรียงความ (Essay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      หมวดหมู่ *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                      disabled={availableCategories.length === 0}
                    >
                      <option value="">
                        {availableCategories.length === 0 ? 'ไม่มีหมวดหมู่ (กรุณาเพิ่มหมวดหมู่ก่อน)' : 'เลือกหมวดหมู่'}
                      </option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {availableCategories.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        กรุณาเพิ่มหมวดหมู่ในหลักสูตรก่อน
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      ระดับความยาก *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="easy">ง่าย</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="hard">ยาก</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      คะแนน *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Options for Multiple Choice and True/False */}
            {(formData.type === 'multiple_choice' || formData.type === 'true_false') && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">ตัวเลือก</h3>
                  {formData.type === 'multiple_choice' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      เพิ่มตัวเลือก
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={() => handleUpdateOption(option.id, 'isCorrect', true)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => handleUpdateOption(option.id, 'text', e.target.value)}
                        placeholder={`ตัวเลือก ${index + 1}`}
                        className="flex-1"
                        required
                      />
                      {formData.type === 'multiple_choice' && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  * เลือกตัวเลือกที่ถูกต้องโดยคลิกที่ radio button
                </p>
              </Card>
            )}

            {/* Answer for Short Answer */}
            {formData.type === 'short_answer' && (
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">คำตอบที่ถูกต้อง</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คำตอบ *
                  </label>
                  <textarea
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="กรอกคำตอบที่ถูกต้อง..."
                    required
                  />
                </div>
              </Card>
            )}

            {/* Info for Essay Questions */}
            {formData.type === 'essay' && (
              <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลข้อสอบอัตนัย</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">ข้อสอบอัตนัยจะใช้ AI ตรวจสอบ</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• ข้อสอบอัตนัยไม่ต้องระบุคำตอบที่ถูกต้อง</li>
                        <li>• ระบบจะใช้ AI ตรวจสอบคำตอบของนักเรียนอัตโนมัติ</li>
                        <li>• อาจารย์ผู้สอนจะตรวจสอบและให้คะแนนขั้นสุดท้ายอีกครั้ง</li>
                        <li>• AI จะให้คะแนนและ feedback เบื้องต้นเพื่อช่วยอาจารย์</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    คำตอบตัวอย่าง (ไม่บังคับ)
                  </label>
                  <textarea
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="กรอกคำตอบตัวอย่างเพื่อช่วย AI ตรวจสอบ (ไม่บังคับ)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    คำตอบตัวอย่างจะช่วยให้ AI ตรวจสอบได้แม่นยำขึ้น แต่ไม่บังคับ
                  </p>
                </div>
              </Card>
            )}

            {/* Explanation */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">คำอธิบาย (ไม่บังคับ)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  คำอธิบายคำตอบ
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="อธิบายว่าทำไมคำตอบนี้ถูกต้อง..."
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• กรอกคำถามให้ชัดเจนและเข้าใจง่าย</li>
                <li>• เลือกหมวดหมู่และระดับความยากให้เหมาะสม</li>
                <li>• สำหรับข้อสอบแบบตัวเลือก ต้องมีคำตอบที่ถูกต้องอย่างน้อย 1 ตัวเลือก</li>
                <li>• ข้อสอบอัตนัยจะใช้ AI ตรวจสอบและให้อาจารย์ตรวจสอบอีกครั้ง</li>
                <li>• คำอธิบายจะช่วยให้นักเรียนเข้าใจมากขึ้น</li>
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
              <Button type="submit" className="flex-1">
                <CheckIcon className="h-5 w-5 mr-2 inline" />
                บันทึก
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

