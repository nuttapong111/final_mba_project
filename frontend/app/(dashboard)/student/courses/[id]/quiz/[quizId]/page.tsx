'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Mock questions
  const questions = [
    {
      id: 'q1',
      question: 'ถ้า x + 5 = 10 แล้ว x มีค่าเท่าไร?',
      type: 'multiple_choice',
      options: ['5', '10', '15', '20'],
      correctAnswer: '5',
    },
    {
      id: 'q2',
      question: 'ผลคูณของ (x + 2)(x - 3) เท่ากับเท่าไร?',
      type: 'multiple_choice',
      options: ['x² - x - 6', 'x² + x - 6', 'x² - 5x + 6', 'x² + 5x - 6'],
      correctAnswer: 'x² - x - 6',
    },
  ];

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setIsSubmitted(true);

    Swal.fire({
      icon: finalScore >= 70 ? 'success' : 'warning',
      title: finalScore >= 70 ? 'สอบผ่าน!' : 'สอบไม่ผ่าน',
      html: `
        <div class="text-center">
          <p class="text-3xl font-bold mb-2">${finalScore}%</p>
          <p>คุณตอบถูก ${correctCount} จาก ${questions.length} ข้อ</p>
          ${finalScore < 70 ? '<p class="mt-2 text-sm text-gray-600">คะแนนขั้นต่ำ: 70%</p>' : ''}
        </div>
      `,
      confirmButtonText: 'ตกลง',
    }).then(() => {
      router.push(`/student/courses/${courseId}`);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แบบทดสอบ</h1>
            <p className="text-gray-600 mt-1">กรุณาตอบคำถามทั้งหมด</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            ยกเลิก
          </Button>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="border-b border-gray-200 pb-6 last:border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {index + 1}. {q.question}
              </h3>
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[q.id] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isSubmitted ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: e.target.value })
                      }
                      disabled={isSubmitted}
                      className="mr-3"
                    />
                    <span>{option}</span>
                    {isSubmitted && option === q.correctAnswer && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 ml-auto" />
                    )}
                    {isSubmitted &&
                      answers[q.id] === option &&
                      option !== q.correctAnswer && (
                        <XCircleIcon className="h-5 w-5 text-red-600 ml-auto" />
                      )}
                  </label>
                ))}
              </div>
            </div>
          ))}
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

