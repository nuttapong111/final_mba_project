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
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { pollsApi, coursesApi } from '@/lib/api';
import type { Poll, PollQuestion } from '@/lib/api/polls';

export default function NewPollPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [poll, setPoll] = useState<Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    questions: [],
  });

  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getById(courseId);
      if (response.success && response.data) {
        setCourse(response.data);
        setLessons((response.data as any).lessons || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
      router.push(`/school/courses/${courseId}/polls`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (type: PollQuestion['type']) => {
    const newQuestion: PollQuestion = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      question: '',
      required: false,
      order: poll.questions.length + 1,
      ...(type === 'rating' && { minRating: 1, maxRating: 5 }),
      ...((type === 'multiple_choice' || type === 'checkbox') && { options: [''] }),
    };
    setPoll({
      ...poll,
      questions: [...poll.questions, newQuestion],
    });
  };

  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    const updated = [...poll.questions];
    updated[index] = { ...updated[index], [field]: value };
    setPoll({ ...poll, questions: updated });
  };

  const handleRemoveQuestion = (index: number) => {
    setPoll({
      ...poll,
      questions: poll.questions.filter((_, i) => i !== index),
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === poll.questions.length - 1) return;

    const updated = [...poll.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPoll({ ...poll, questions: updated });
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...poll.questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [''];
    } else {
      updated[questionIndex].options!.push('');
    }
    setPoll({ ...poll, questions: updated });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...poll.questions];
    if (updated[questionIndex].options && updated[questionIndex].options!.length > 1) {
      updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
      setPoll({ ...poll, questions: updated });
    }
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...poll.questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
      setPoll({ ...poll, questions: updated });
    }
  };

  const handleSubmit = async () => {
    if (!poll.title.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกชื่อแบบประเมิน',
      });
      return;
    }

    if (poll.questions.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'กรุณาเพิ่มคำถามอย่างน้อย 1 คำถาม',
      });
      return;
    }

    for (let i = 0; i < poll.questions.length; i++) {
      const q = poll.questions[i];
      if (!q.question.trim()) {
        Swal.fire({
          icon: 'error',
          title: `กรุณากรอกคำถามที่ ${i + 1}`,
        });
        return;
      }

      if ((q.type === 'multiple_choice' || q.type === 'checkbox') && q.options) {
        const hasEmptyOption = q.options.some(opt => !opt.trim());
        if (hasEmptyOption) {
          Swal.fire({
            icon: 'error',
            title: `กรุณากรอกตัวเลือกให้ครบในคำถามที่ ${i + 1}`,
          });
          return;
        }
      }
    }

    try {
      const pollData = {
        title: poll.title.trim(),
        description: poll.description?.trim() || undefined,
        questions: poll.questions.map((q, index) => ({
          question: q.question.trim(),
          type: q.type,
          required: q.required || false,
          options: q.options || undefined,
          order: index + 1,
        })),
      };

      const response = await pollsApi.create(courseId, pollData);

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'สร้างแบบประเมินสำเร็จ!',
          text: 'แบบประเมินถูกสร้างเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });

        // Use router.replace to avoid back button issues, or router.push with refresh
        router.push(`/school/courses/${courseId}/polls`);
        // Force refresh after navigation
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถสร้างแบบประเมินได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถสร้างแบบประเมินได้',
      });
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
          <h2 className="text-2xl font-bold text-gray-900">สร้างแบบประเมินใหม่</h2>
          <p className="text-gray-600 mt-1">{course?.title || 'กำลังโหลด...'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลแบบประเมิน</h3>
            <div className="space-y-4">
              <Input
                label="ชื่อแบบประเมิน *"
                value={poll.title}
                onChange={(e) => setPoll({ ...poll, title: e.target.value })}
                placeholder="เช่น แบบประเมินความพึงพอใจ"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  คำอธิบาย
                </label>
                <textarea
                  value={poll.description || ''}
                  onChange={(e) => setPoll({ ...poll, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="อธิบายเกี่ยวกับแบบประเมิน..."
                />
              </div>
              {lessons && lessons.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    เพิ่มในบทเรียน (ไม่บังคับ)
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">ไม่เพิ่มในบทเรียน</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Card>

          {/* Questions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">คำถาม</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('text')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + ข้อความ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + ตัวเลือกเดียว
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('checkbox')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + หลายตัวเลือก
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('rating')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  + Rating
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {poll.questions.map((question, index) => (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">คำถาม {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(index, 'down')}
                        disabled={index === poll.questions.length - 1}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      value={question.question}
                      onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                      placeholder="กรอกคำถาม..."
                      required
                    />

                    <div className="flex items-center space-x-4">
                      <select
                        value={question.type}
                        onChange={(e) => handleUpdateQuestion(index, 'type', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="text">ข้อความ</option>
                        <option value="multiple_choice">ตัวเลือกเดียว</option>
                        <option value="checkbox">หลายตัวเลือก</option>
                        <option value="rating">Rating</option>
                      </select>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleUpdateQuestion(index, 'required', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">จำเป็นต้องตอบ</span>
                      </label>
                    </div>

                    {(question.type === 'multiple_choice' || question.type === 'checkbox') && question.options && (
                      <div className="space-y-2 ml-4">
                        <label className="block text-xs font-medium text-gray-600">ตัวเลือก</label>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                              placeholder={`ตัวเลือก ${optIndex + 1}`}
                              className="flex-1"
                              required
                            />
                            {question.options && question.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index, optIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(index)}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <PlusIcon className="h-4 w-4 mr-1 inline" />
                          เพิ่มตัวเลือก
                        </button>
                      </div>
                    )}

                    {question.type === 'rating' && (
                      <div className="grid grid-cols-2 gap-3 ml-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">คะแนนต่ำสุด</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={(question as any).minRating || 1}
                            onChange={(e) => handleUpdateQuestion(index, 'minRating', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">คะแนนสูงสุด</label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={(question as any).maxRating || 5}
                            onChange={(e) => handleUpdateQuestion(index, 'maxRating', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {poll.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>ยังไม่มีคำถาม คลิกปุ่มด้านบนเพื่อเพิ่มคำถาม</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">คำแนะนำ</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• กรอกชื่อแบบประเมินให้ชัดเจน</li>
              <li>• เพิ่มคำถามตามต้องการ</li>
              <li>• เลือกประเภทคำถามให้เหมาะสม</li>
              <li>• กำหนดว่าคำถามจำเป็นต้องตอบหรือไม่</li>
              <li>• สามารถเรียงลำดับคำถามได้</li>
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
            <Button type="button" className="flex-1" onClick={handleSubmit}>
              <CheckIcon className="h-5 w-5 mr-2 inline" />
              บันทึก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

