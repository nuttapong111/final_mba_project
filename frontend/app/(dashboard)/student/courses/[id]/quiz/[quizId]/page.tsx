'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Track elapsed time

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
            const totalDuration = response.data.quizSettings.duration * 60; // Convert minutes to seconds
            
            // Check if there's saved time from localStorage
            const storageKey = `quiz_timer_${quizId}`;
            const savedData = localStorage.getItem(storageKey);
            
            if (savedData) {
              try {
                const parsed = JSON.parse(savedData);
                const savedStartTime = parsed.startTime;
                const savedElapsed = parsed.elapsedTime || 0;
                const now = Date.now();
                
                // Calculate elapsed time since last save
                const additionalElapsed = Math.floor((now - savedStartTime) / 1000);
                const totalElapsed = savedElapsed + additionalElapsed;
                
                // Calculate remaining time
                const remaining = Math.max(0, totalDuration - totalElapsed);
                
                setTimeRemaining(remaining);
                setElapsedTime(totalElapsed);
                setStartTime(savedStartTime);
                
                // If time is up, mark as submitted (will be handled by timer useEffect)
                if (remaining <= 0) {
                  setIsSubmitted(true);
                }
              } catch (error) {
                console.error('Error parsing saved timer data:', error);
                // Fallback to fresh start
                setTimeRemaining(totalDuration);
                setStartTime(Date.now());
                setElapsedTime(0);
              }
            } else {
              // Fresh start
              setTimeRemaining(totalDuration);
              setStartTime(Date.now());
              setElapsedTime(0);
              
              // Save to localStorage
              const storageKey = `quiz_timer_${quizId}`;
              localStorage.setItem(storageKey, JSON.stringify({
                startTime: Date.now(),
                elapsedTime: 0,
                totalDuration: totalDuration,
              }));
            }
          } else {
            setStartTime(Date.now());
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitted || submitting) return;

    setSubmitting(true);
    setIsSubmitted(true);

    try {
      // Calculate time spent (use elapsedTime if available, otherwise calculate from startTime)
      const timeSpent = elapsedTime > 0 
        ? Math.round(elapsedTime / 60) 
        : (startTime ? Math.round((Date.now() - startTime) / 1000 / 60) : undefined);
      
      // Clear timer from localStorage
      const storageKey = `quiz_timer_${quizId}`;
      localStorage.removeItem(storageKey);

      // Prepare answers
      const submitAnswers = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));

      // Submit quiz via API
      const response = await examsApi.submitQuiz(quizId, {
        answers: submitAnswers,
        timeSpent,
      });

      if (response.success && response.data) {
        const submission = response.data;
        
        // Check if there are essay questions from API response
        const hasEssayQuestions = submission.hasEssayQuestions || false;
        
        // Get score and percentage
        const finalScore = submission.score || 0;
        const percentage = submission.percentage || 0;
        const passed = submission.passed;
        const passingPercentage = quizSettings?.passingPercentage || 70;
        const totalScore = submission.totalScore || questions.reduce((sum, q) => sum + q.points, 0);

        setScore(percentage);

        // Show result with AI feedback info if essay questions exist
        let resultHtml = `
        <div class="text-center">
            <p class="text-3xl font-bold mb-2">${percentage.toFixed(1)}%</p>
            <p>คุณได้ ${finalScore} จาก ${totalScore} คะแนน</p>
        `;

        if (hasEssayQuestions) {
          resultHtml += `
            <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-800 font-semibold mb-1">⚠️ มีข้อสอบอัตนัยที่รอการตรวจสอบ</p>
              <p class="text-xs text-yellow-700">AI ได้ให้คำแนะนำเบื้องต้นแล้ว อาจารย์จะตรวจสอบและให้คะแนนสุดท้ายในภายหลัง</p>
            </div>
          `;
        }

        resultHtml += `
            ${!passed && percentage < passingPercentage ? `<p class="mt-2 text-sm text-red-600">คะแนนขั้นต่ำ: ${passingPercentage}%</p>` : ''}
        </div>
        `;

        Swal.fire({
          icon: passed ? 'success' : (hasEssayQuestions ? 'info' : 'warning'),
          title: passed ? 'สอบผ่าน!' : (hasEssayQuestions ? 'ส่งข้อสอบสำเร็จ' : 'สอบไม่ผ่าน'),
          html: resultHtml,
      confirmButtonText: 'ตกลง',
    }).then(() => {
      router.push(`/student/courses/${courseId}`);
    });
      } else {
        throw new Error(response.error || 'ไม่สามารถส่งข้อสอบได้');
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setIsSubmitted(false);
      setSubmitting(false);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งข้อสอบได้',
      });
    }
  }, [isSubmitted, submitting, elapsedTime, startTime, quizId, questions, answers, quizSettings, courseId, router]);

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
        
        // Update elapsed time
        setElapsedTime((prevElapsed) => {
          const newElapsed = prevElapsed + 1;
          
          // Save to localStorage every 5 seconds
          if (newElapsed % 5 === 0 && startTime) {
            const storageKey = `quiz_timer_${quizId}`;
            localStorage.setItem(storageKey, JSON.stringify({
              startTime: startTime,
              elapsedTime: newElapsed,
              totalDuration: (quizSettings?.duration || 60) * 60,
            }));
          }
          
          return newElapsed;
        });
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted, startTime, quizId, quizSettings, handleSubmit]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Modern Header with Progress */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    แบบทดสอบ
                  </h1>
                  <p className="text-gray-600 mt-1">กรุณาตอบคำถามทั้งหมด ({questions.length} ข้อ)</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>ความคืบหน้า</span>
                  <span>{Object.keys(answers).length} / {questions.length} ข้อ</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-6">
              {timeRemaining !== null && (
                <div className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg animate-pulse">
                  <ClockIcon className="h-5 w-5" />
                  <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                </div>
              )}
              {!isSubmitted && (
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  ยกเลิก
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Questions Container */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const correctOption = q.options.find((opt) => opt.isCorrect);
            const userAnswer = answers[q.id];
            const isCorrect = correctOption && userAnswer === correctOption.text;

            return (
              <Card key={q.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 shadow-lg">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-white flex-1">
                        {q.question}
              </h3>
                    </div>
                    <span className="flex-shrink-0 ml-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                      {q.points} คะแนน
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="space-y-3">
                    {q.type === 'multiple_choice' || q.type === 'true_false' ? (
                      q.options.map((option) => (
                  <label
                          key={option.id}
                          className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            answers[q.id] === option.text
                              ? isSubmitted 
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50 shadow-md'
                                  : 'border-red-500 bg-red-50 shadow-md'
                                : 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          } ${isSubmitted ? 'cursor-not-allowed' : ''}`}
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
                            className="mr-4 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-gray-800 font-medium">{option.text}</span>
                          {isSubmitted && option.isCorrect && (
                            <CheckCircleIcon className="h-6 w-6 text-green-600 ml-auto animate-pulse" />
                    )}
                    {isSubmitted &&
                            answers[q.id] === option.text &&
                            !option.isCorrect && (
                              <XCircleIcon className="h-6 w-6 text-red-600 ml-auto animate-pulse" />
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none"
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 resize-none"
                        placeholder="กรอกคำตอบ..."
                      />
                    )}
                  </div>
                  {isSubmitted && q.explanation && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-r-lg">
                      <p className="text-sm text-gray-800">
                        <strong className="text-blue-600">💡 คำอธิบาย:</strong> {q.explanation}
                      </p>
              </div>
                  )}
            </div>
              </Card>
            );
          })}
        </div>

        {/* Submit Button */}
        {!isSubmitted && (
          <div className="sticky bottom-0 bg-white rounded-2xl shadow-2xl p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.keys(answers).length === questions.length ? (
                  <span className="text-green-600 font-semibold">✓ ตอบครบทุกข้อแล้ว</span>
                ) : (
                  <span className="text-orange-600 font-semibold">
                    ⚠ ยังตอบไม่ครบ {questions.length - Object.keys(answers).length} ข้อ
                  </span>
                )}
              </div>
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
                className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
              ส่งคำตอบ
            </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

