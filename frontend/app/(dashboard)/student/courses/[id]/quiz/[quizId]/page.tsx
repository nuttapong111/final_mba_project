'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { examsApi } from '@/lib/api';
import type { QuizQuestion } from '@/lib/api/exams';

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSettings, setQuizSettings] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await examsApi.getQuizQuestions(quizId);
        if (response.success && response.data) {
          setQuestions(response.data.questions);
          setQuizSettings(response.data.quizSettings);
          
          // Set timer if duration is specified
          if (response.data.quizSettings.duration) {
            setTimeRemaining(response.data.quizSettings.duration * 60); // Convert minutes to seconds
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถโหลดข้อสอบได้',
          });
          router.back();
        }
      } catch (error: any) {
        console.error('Error fetching quiz:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อสอบได้',
        });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    setIsSubmitted(true);

    // Calculate score
    let totalPoints = 0;
    let maxPoints = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      maxPoints += q.points;
      const userAnswer = answers[q.id];
      
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const correctOption = q.options.find((opt) => opt.isCorrect);
        if (correctOption && userAnswer === correctOption.text) {
          totalPoints += q.points;
          correctCount++;
        }
      } else if (q.type === 'short_answer') {
        // For short answer, check if answer matches (case insensitive)
        const correctOption = q.options.find((opt) => opt.isCorrect);
        if (correctOption && userAnswer?.toLowerCase().trim() === correctOption.text.toLowerCase().trim()) {
          totalPoints += q.points;
          correctCount++;
        }
      }
      // Essay questions are not auto-graded
    });

    const finalScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    const passingPercentage = quizSettings?.passingPercentage || 70;
    const passed = finalScore >= passingPercentage;

    setScore(finalScore);

    Swal.fire({
      icon: passed ? 'success' : 'warning',
      title: passed ? 'สอบผ่าน!' : 'สอบไม่ผ่าน',
      html: `
        <div class="text-center">
          <p class="text-3xl font-bold mb-2">${finalScore}%</p>
          <p>คุณได้ ${totalPoints} จาก ${maxPoints} คะแนน</p>
          <p class="text-sm text-gray-600 mt-2">ตอบถูก ${correctCount} จาก ${questions.length} ข้อ</p>
          ${!passed ? `<p class="mt-2 text-sm text-red-600">คะแนนขั้นต่ำ: ${passingPercentage}%</p>` : ''}
        </div>
      `,
      confirmButtonText: 'ตกลง',
    }).then(() => {
      router.push(`/student/courses/${courseId}`);
    });
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อสอบ...</p>
        </div>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">ไม่พบข้อสอบ</p>
          <Button onClick={() => router.back()} className="mt-4">
            กลับ
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แบบทดสอบ</h1>
            <p className="text-gray-600 mt-1">กรุณาตอบคำถามทั้งหมด ({questions.length} ข้อ)</p>
          </div>
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <ClockIcon className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-600">{formatTime(timeRemaining)}</span>
              </div>
            )}
            {!isSubmitted && (
              <Button variant="outline" onClick={() => router.back()}>
                ยกเลิก
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => {
            const correctOption = q.options.find((opt) => opt.isCorrect);
            const userAnswer = answers[q.id];
            const isCorrect = correctOption && userAnswer === correctOption.text;

            return (
              <div key={q.id} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {index + 1}. {q.question}
                  </h3>
                  <span className="text-sm text-gray-500 ml-4">
                    ({q.points} คะแนน)
                  </span>
                </div>
                <div className="space-y-2">
                  {q.type === 'multiple_choice' || q.type === 'true_false' ? (
                    q.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          answers[q.id] === option.text
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isSubmitted ? 'opacity-60' : ''}`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option.text}
                          checked={answers[q.id] === option.text}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.id]: e.target.value })
                          }
                          disabled={isSubmitted}
                          className="mr-3"
                        />
                        <span className="flex-1">{option.text}</span>
                        {isSubmitted && option.isCorrect && (
                          <CheckCircleIcon className="h-5 w-5 text-green-600 ml-auto" />
                        )}
                        {isSubmitted &&
                          answers[q.id] === option.text &&
                          !option.isCorrect && (
                            <XCircleIcon className="h-5 w-5 text-red-600 ml-auto" />
                          )}
                      </label>
                    ))
                  ) : q.type === 'short_answer' ? (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                      disabled={isSubmitted}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="กรอกคำตอบ..."
                    />
                  ) : (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                      disabled={isSubmitted}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="กรอกคำตอบ..."
                    />
                  )}
                </div>
                {isSubmitted && q.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>คำอธิบาย:</strong> {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isSubmitted && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
            >
              ส่งคำตอบ
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

