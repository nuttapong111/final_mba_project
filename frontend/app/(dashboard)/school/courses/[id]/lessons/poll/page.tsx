'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  XMarkIcon, 
  Bars3Icon,
  DocumentTextIcon,
  CheckCircleIcon,
  StarIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import type { Poll, PollQuestion } from '@/lib/mockData';

export default function CreatePollPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  
  const [poll, setPoll] = useState<Poll>({
    id: `${Date.now()}`,
    title: 'แบบประเมินความพึงพอใจ',
    description: 'กรุณากรอกแบบประเมินเพื่อช่วยปรับปรุงหลักสูตร',
    questions: [],
    createdAt: new Date().toISOString(),
  });

  const handleAddQuestion = (type: PollQuestion['type']) => {
    const newQuestion: PollQuestion = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      question: '',
      required: false,
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

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...poll.questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
      setPoll({ ...poll, questions: updated });
    }
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...poll.questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
      setPoll({ ...poll, questions: updated });
    }
  };

  const handleSave = async () => {
    if (!poll.title.trim()) {
      await Swal.fire({
        icon: 'error',
        title: 'กรุณากรอกหัวข้อแบบประเมิน',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    if (poll.questions.length === 0) {
      await Swal.fire({
        icon: 'error',
        title: 'กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    // Validate questions
    for (let i = 0; i < poll.questions.length; i++) {
      const q = poll.questions[i];
      if (!q.question.trim()) {
        await Swal.fire({
          icon: 'error',
          title: `กรุณากรอกคำถามข้อที่ ${i + 1}`,
          confirmButtonText: 'ตกลง',
        });
        return;
      }
      if ((q.type === 'multiple_choice' || q.type === 'checkbox') && (!q.options || q.options.length === 0 || q.options.every(opt => !opt.trim()))) {
        await Swal.fire({
          icon: 'error',
          title: `กรุณาเพิ่มตัวเลือกสำหรับคำถามข้อที่ ${i + 1}`,
          confirmButtonText: 'ตกลง',
        });
        return;
      }
    }

    await Swal.fire({
      icon: 'success',
      title: 'บันทึกแบบประเมินสำเร็จ!',
      text: 'แบบประเมินถูกบันทึกเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false,
    });

    router.back();
  };

  const getQuestionTypeIcon = (type: PollQuestion['type']) => {
    switch (type) {
      case 'text':
        return DocumentTextIcon;
      case 'multiple_choice':
        return CheckCircleIcon;
      case 'checkbox':
        return Squares2X2Icon;
      case 'rating':
        return StarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getQuestionTypeLabel = (type: PollQuestion['type']) => {
    switch (type) {
      case 'text':
        return 'ข้อความสั้น';
      case 'multiple_choice':
        return 'ตัวเลือกเดียว';
      case 'checkbox':
        return 'หลายตัวเลือก';
      case 'rating':
        return 'คะแนน';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">สร้างแบบประเมินความพึงพอใจ</h1>
            <p className="text-gray-600 mt-1">สร้างแบบประเมินคล้าย Google Form</p>
          </div>
        </div>
        <Button onClick={handleSave}>
          บันทึกแบบประเมิน
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Poll Header */}
        <Card>
          <div className="space-y-4">
            <div className="border-b-2 border-blue-500 pb-2">
              <Input
                value={poll.title}
                onChange={(e) => setPoll({ ...poll, title: e.target.value })}
                placeholder="หัวข้อแบบประเมิน"
                className="text-2xl font-bold border-0 focus:ring-0 p-0"
              />
            </div>
            <div>
              <textarea
                value={poll.description}
                onChange={(e) => setPoll({ ...poll, description: e.target.value })}
                placeholder="คำอธิบายแบบประเมิน (ไม่บังคับ)"
                rows={2}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Questions */}
        {poll.questions.map((question, index) => {
          const QuestionIcon = getQuestionTypeIcon(question.type);
          return (
            <Card key={question.id}>
              <div className="space-y-4">
                {/* Question Header */}
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={question.question}
                        onChange={(e) => handleUpdateQuestion(index, 'question', e.target.value)}
                        placeholder="คำถาม"
                        className="border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:ring-0 rounded-none"
                      />
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="ย้ายขึ้น"
                        >
                          <Bars3Icon className="h-5 w-5 rotate-90" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === poll.questions.length - 1}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          title="ย้ายลง"
                        >
                          <Bars3Icon className="h-5 w-5 -rotate-90" />
                        </button>
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="ลบคำถาม"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Type Badge */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                        <QuestionIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{getQuestionTypeLabel(question.type)}</span>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleUpdateQuestion(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">จำเป็นต้องตอบ</span>
                      </label>
                    </div>

                    {/* Question Content Based on Type */}
                    {question.type === 'text' && (
                      <div className="ml-12">
                        <div className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors">
                          <p className="text-sm text-gray-400">คำตอบสั้น</p>
                        </div>
                      </div>
                    )}

                    {question.type === 'multiple_choice' && (
                      <div className="ml-12 space-y-3">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-3 group">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0 group-hover:border-blue-500 transition-colors"></div>
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                              placeholder={`ตัวเลือก ${optIndex + 1}`}
                              className="border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 rounded-none bg-transparent hover:bg-gray-50 px-2 py-1"
                            />
                            {question.options!.length > 1 && (
                              <button
                                onClick={() => handleRemoveOption(index, optIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddOption(index)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm ml-8 mt-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>เพิ่มตัวเลือก</span>
                        </button>
                      </div>
                    )}

                    {question.type === 'checkbox' && (
                      <div className="ml-12 space-y-3">
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-3 group">
                            <div className="w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0 group-hover:border-blue-500 transition-colors"></div>
                            <Input
                              value={option}
                              onChange={(e) => handleUpdateOption(index, optIndex, e.target.value)}
                              placeholder={`ตัวเลือก ${optIndex + 1}`}
                              className="border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 rounded-none bg-transparent hover:bg-gray-50 px-2 py-1"
                            />
                            {question.options!.length > 1 && (
                              <button
                                onClick={() => handleRemoveOption(index, optIndex)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddOption(index)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm ml-8 mt-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>เพิ่มตัวเลือก</span>
                        </button>
                      </div>
                    )}

                    {question.type === 'rating' && (
                      <div className="ml-12">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">คะแนน:</span>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={question.minRating || 1}
                              onChange={(e) => handleUpdateQuestion(index, 'minRating', parseInt(e.target.value))}
                              className="w-20"
                              min={1}
                            />
                            <span className="text-gray-600">ถึง</span>
                            <Input
                              type="number"
                              value={question.maxRating || 5}
                              onChange={(e) => handleUpdateQuestion(index, 'maxRating', parseInt(e.target.value))}
                              className="w-20"
                              min={2}
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center space-x-2">
                          {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }, (_, i) => (
                            <div key={i} className="flex items-center space-x-1">
                              <StarIcon className="h-6 w-6 text-yellow-400" />
                              <span className="text-sm text-gray-600">{i + (question.minRating || 1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Add Question Buttons */}
        <Card>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleAddQuestion('text')}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-gray-600" />
              <span>ข้อความสั้น</span>
            </button>
            <button
              onClick={() => handleAddQuestion('multiple_choice')}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5 text-gray-600" />
              <span>ตัวเลือกเดียว</span>
            </button>
            <button
              onClick={() => handleAddQuestion('checkbox')}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Squares2X2Icon className="h-5 w-5 text-gray-600" />
              <span>หลายตัวเลือก</span>
            </button>
            <button
              onClick={() => handleAddQuestion('rating')}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <StarIcon className="h-5 w-5 text-gray-600" />
              <span>คะแนน</span>
            </button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>
            บันทึกแบบประเมิน
          </Button>
        </div>
      </div>
    </div>
  );
}

