'use client';

import { useState, useEffect } from 'react';
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
import { pollsApi, coursesApi, contentProgressApi } from '@/lib/api';
import type { Poll, PollQuestion } from '@/lib/api/polls';

interface PollAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export default function TakePollPage() {
  const params = useParams();
  const courseId = params.id as string;
  const pollId = params.pollId as string;
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, PollAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pollsResponse, courseResponse, statusResponse] = await Promise.all([
          pollsApi.getByCourse(courseId),
          coursesApi.getById(courseId),
          pollsApi.getResponseStatus(pollId),
        ]);

        if (pollsResponse.success && pollsResponse.data) {
          // หา poll จาก list
          const pollItem = pollsResponse.data.find(
            (item) => item.poll.id === pollId || item.id === pollId
          );
          if (pollItem) {
            setPoll(pollItem.poll);
            
            // Get contentId from pollItem if available
            if (pollItem.contentId) {
              // Check if already completed
              try {
                const progressResponse = await contentProgressApi.getContentProgress(pollItem.contentId);
                if (progressResponse.success && progressResponse.data?.completed) {
                  setIsSubmitted(true);
                  setSubmittedAt(progressResponse.data.completedAt || new Date().toISOString());
                }
              } catch (error) {
                console.error('Error checking poll completion status:', error);
              }
            }
          }
        }

        if (courseResponse.success && courseResponse.data) {
          setCourse(courseResponse.data);
        }

        // Check if already submitted
        if (statusResponse.success && statusResponse.data) {
          if (statusResponse.data.submitted) {
            setIsSubmitted(true);
            setSubmittedAt(statusResponse.data.submittedAt || null);
          }
        }
      } catch (error) {
        console.error('Error fetching poll:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดแบบประเมินได้',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, pollId]);

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดแบบประเมิน...</p>
        </div>
      </Card>
    );
  }

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

  // Show submitted message if already submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">ส่งแบบประเมินสำเร็จแล้ว</h2>
              <p className="text-gray-600 mb-4">
                คุณได้ส่งแบบประเมิน "{poll.title}" เรียบร้อยแล้ว
              </p>
              {submittedAt && (
                <p className="text-sm text-gray-500">
                  ส่งเมื่อ: {new Date(submittedAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-4">
                แบบประเมินสามารถส่งได้เพียงครั้งเดียว
              </p>
            </div>
            <Button onClick={() => router.back()} className="mt-6">
              กลับ
            </Button>
          </Card>
        </div>
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
      const questionId = question.id || '';
      if (!answers[questionId] || 
          (typeof answers[questionId]?.answer === 'string' && !(answers[questionId].answer as string).trim()) ||
          (Array.isArray(answers[questionId]?.answer) && (answers[questionId].answer as string[]).length === 0)) {
        Swal.fire({
          icon: 'error',
          title: 'กรุณาตอบคำถามที่จำเป็น',
          text: `กรุณาตอบคำถาม: "${question.question}"`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare answers array
      const submitAnswers = Object.values(answers).map((answer) => ({
        questionId: answer.questionId,
        answer: answer.answer,
      }));

      // Submit poll via API
      const response = await pollsApi.submit(pollId, {
        answers: submitAnswers,
      });

      if (response.success) {
        // Update submitted status
        setIsSubmitted(true);
        setSubmittedAt(new Date().toISOString());
        
        // Find contentId from poll to mark as completed
        if (poll) {
          // Try to find contentId from course lessons
          try {
            const courseResponse = await coursesApi.getById(courseId);
            if (courseResponse.success && courseResponse.data) {
              const lessons = courseResponse.data.lessons || [];
              for (const lesson of lessons) {
                const content = lesson.contents?.find((c: any) => 
                  c.type === 'poll' && (c.poll?.id === pollId || c.id === pollId)
                );
                if (content?.id) {
                  // Mark content as completed
                  try {
                    await contentProgressApi.markContentCompleted(content.id, courseId);
                    console.log(`[POLL] Marked content ${content.id} as completed`);
                  } catch (error) {
                    console.error('Error marking content as completed:', error);
                  }
                  break;
                }
              }
            }
          } catch (error) {
            console.error('Error finding content for poll:', error);
          }
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'ส่งแบบประเมินสำเร็จ!',
          text: 'ขอบคุณที่ให้ความร่วมมือในการประเมิน',
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh the parent page to update progress
        // Use router.back() and then refresh, or use window.location
        setTimeout(() => {
          router.back();
          // Trigger a refresh on the parent page
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('contentCompleted'));
          }
        }, 2000);
      } else {
        throw new Error(response.error || 'ไม่สามารถส่งแบบประเมินได้');
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งแบบประเมินได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <CheckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {poll.title}
                  </h1>
                  <p className="text-gray-600 mt-1">{course?.title}</p>
                </div>
              </div>
            </div>
          </div>
          {poll.description && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-l-4 border-purple-500">
              <p className="text-gray-700">{poll.description}</p>
            </div>
          )}
        </div>

        {/* Questions Container */}
        <div className="space-y-6">
          {poll.questions.map((question, index) => {
            const questionId = question.id || `q-${index}`;
            return (
            <Card key={questionId} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-purple-600 shadow-lg">
                    {index + 1}
                  </div>
                  <label className="block text-lg font-semibold text-white flex-1">
                    {question.question}
                    {question.required && <span className="text-red-200 ml-1">*</span>}
                  </label>
                </div>
              </div>
              <div className="p-6 bg-white">

                <div className="space-y-3">
                  {question.type === 'text' && (
                    <textarea
                      value={(answers[questionId]?.answer as string) || ''}
                      onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 resize-none"
                      placeholder="กรอกคำตอบ..."
                      required={question.required}
                    />
                  )}

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            answers[questionId]?.answer === option
                              ? 'border-purple-500 bg-purple-50 shadow-md scale-[1.02]'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${questionId}`}
                            value={option}
                            checked={answers[questionId]?.answer === option}
                            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                            required={question.required}
                          />
                          <span className="text-gray-800 font-medium flex-1">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && question.options && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <label
                          key={optIndex}
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            (answers[questionId]?.answer as string[])?.includes(option)
                              ? 'border-purple-500 bg-purple-50 shadow-md scale-[1.02]'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={option}
                            checked={(answers[questionId]?.answer as string[])?.includes(option) || false}
                            onChange={(e) => {
                              const currentAnswers = (answers[questionId]?.answer as string[]) || [];
                              if (e.target.checked) {
                                handleAnswerChange(questionId, [...currentAnswers, option]);
                              } else {
                                handleAnswerChange(questionId, currentAnswers.filter(a => a !== option));
                              }
                            }}
                            className="h-5 w-5 text-purple-600 focus:ring-purple-500 rounded"
                          />
                          <span className="text-gray-800 font-medium flex-1">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                      <span className="text-sm font-semibold text-gray-700">
                        {question.minRating || 1}
                      </span>
                      <div className="flex space-x-2">
                        {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }, (_, i) => {
                          const rating = (question.minRating || 1) + i;
                          return (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleAnswerChange(questionId, rating)}
                              className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-110 ${
                                answers[questionId]?.answer === rating
                                  ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-110'
                                  : 'bg-white text-gray-400 hover:bg-yellow-100'
                              }`}
                            >
                              <StarIcon className="h-8 w-8" />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {question.maxRating || 5}
                      </span>
                      {answers[questionId]?.answer && (
                        <span className="text-sm font-bold text-purple-600 ml-4 px-3 py-1 bg-white rounded-full">
                          {answers[questionId].answer as number} ⭐
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
          })}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-white rounded-2xl shadow-2xl p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 border-gray-300 hover:bg-gray-50"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="h-5 w-5 mr-2 inline" />
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

