'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  ArrowLeftIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import {
  mockCourses,
  getCourseWithLessons,
  type Poll,
  type PollQuestion,
} from '@/lib/mockData';

interface PollAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export default function TakePollPage() {
  const params = useParams();
  const courseId = params.id as string;
  const pollId = params.pollId as string;
  const router = useRouter();
  const course = mockCourses.find(c => c.id === courseId);
  const courseWithLessons = getCourseWithLessons(courseId);

  // หา poll จาก course
  const findPoll = (): Poll | null => {
    if (!courseWithLessons?.lessons) return null;
    for (const lesson of courseWithLessons.lessons) {
      for (const content of lesson.contents) {
        if (content.type === 'poll' && content.poll && content.id === pollId) {
          return content.poll;
        }
      }
    }
    return null;
  };

  const poll = findPoll();
  const [answers, setAnswers] = useState<Record<string, PollAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!poll) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบแบบประเมิน</p>
        <Button onClick={() => router.back()} className="mt-4">
          กลับ
        </Button>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({
      ...answers,
      [questionId]: { questionId, answer: value },
    });
  };

  const handleSubmit = async () => {
    // ตรวจสอบคำถามที่จำเป็นต้องตอบ
    const requiredQuestions = poll.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      if (!answers[question.id] || 
          (typeof answers[question.id]?.answer === 'string' && !answers[question.id].answer.trim()) ||
          (Array.isArray(answers[question.id]?.answer) && answers[question.id].answer.length === 0)) {
        Swal.fire({
          icon: 'error',
          title: 'กรุณาตอบคำถามที่จำเป็น',
          text: `กรุณาตอบคำถาม: "${question.question}"`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    await Swal.fire({
      icon: 'success',
      title: 'ส่งแบบประเมินสำเร็จ!',
      text: 'ขอบคุณที่ให้ความร่วมมือในการประเมิน',
      timer: 2000,
      showConfirmButton: false,
    });

    router.back();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
      </div>

      {poll.description && (
        <Card>
          <p className="text-gray-700">{poll.description}</p>
        </Card>
      )}

      <Card>
        <div className="space-y-6">
          {poll.questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <div className="mb-4">
                <label className="block text-lg font-medium text-gray-900 mb-1">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>

              <div className="ml-4">
                {question.type === 'text' && (
                  <textarea
                    value={(answers[question.id]?.answer as string) || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="กรอกคำตอบ..."
                    required={question.required}
                  />
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id]?.answer === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          required={question.required}
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'checkbox' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          value={option}
                          checked={(answers[question.id]?.answer as string[])?.includes(option) || false}
                          onChange={(e) => {
                            const currentAnswers = (answers[question.id]?.answer as string[]) || [];
                            if (e.target.checked) {
                              handleAnswerChange(question.id, [...currentAnswers, option]);
                            } else {
                              handleAnswerChange(question.id, currentAnswers.filter(a => a !== option));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {question.minRating || 1}
                    </span>
                    <div className="flex space-x-1">
                      {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }, (_, i) => {
                        const rating = (question.minRating || 1) + i;
                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleAnswerChange(question.id, rating)}
                            className={`p-2 rounded-lg transition-colors ${
                              answers[question.id]?.answer === rating
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <StarIcon className="h-6 w-6" />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-sm text-gray-600">
                      {question.maxRating || 5}
                    </span>
                    {answers[question.id]?.answer && (
                      <span className="text-sm font-medium text-gray-700 ml-2">
                        ({answers[question.id].answer as number} คะแนน)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <CheckIcon className="h-5 w-5 mr-2 inline" />
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
        </Button>
      </div>
    </div>
  );
}

