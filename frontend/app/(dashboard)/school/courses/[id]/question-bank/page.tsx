'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { questionBanksApi, coursesApi } from '@/lib/api';

export default function CourseQuestionBankPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [questionBank, setQuestionBank] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (questionBank?.id) {
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionBank?.id, selectedCategory, selectedDifficulty]);

  // Debounce search term
  useEffect(() => {
    if (!questionBank?.id) return;

    const timeoutId = setTimeout(() => {
      fetchQuestions();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, questionBank?.id]);

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
        setCategories(
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

  const fetchQuestions = async () => {
    if (!questionBank?.id) return;

    try {
      const response = await questionBanksApi.getQuestions(questionBank.id, {
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'ไม่มีหมวดหมู่';
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'ง่าย';
      case 'MEDIUM':
        return 'ปานกลาง';
      case 'HARD':
        return 'ยาก';
      default:
        return difficulty;
    }
  };

  const handleAddQuestion = () => {
    router.push(`/school/courses/${courseId}/question-bank/new`);
  };

  const handleEditQuestion = (questionId: string) => {
    Swal.fire({
      title: 'แก้ไขข้อสอบ',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบข้อสอบนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        const response = await questionBanksApi.deleteQuestion(questionId);

        if (response.success) {
          // Refresh questions list and question bank data
          await fetchQuestions();
          await fetchData();
          
          await Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ',
            text: 'ข้อสอบถูกลบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่สามารถลบข้อสอบได้',
          });
        }
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.response?.data?.error || error.message || 'ไม่สามารถลบข้อสอบได้',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">คลังข้อสอบ</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
        <Button onClick={handleAddQuestion}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มข้อสอบใหม่
        </Button>
      </div>

      {/* Categories Summary */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.id} hover>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">{category.name}</p>
                <p className="text-2xl font-bold text-gray-900">{category.questionCount}</p>
                <p className="text-xs text-gray-400 mt-1">ข้อสอบ</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="ค้นหาข้อสอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทุกระดับความยาก</option>
            <option value="EASY">ง่าย</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="HARD">ยาก</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Questions List */}
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {getDifficultyLabel(question.difficulty)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryName(question.categoryId)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {question.points} คะแนน
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium mb-3">{question.question}</p>
                    {question.type === 'MULTIPLE_CHOICE' && question.options && question.options.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {question.options.map((option: any, index: number) => (
                          <div
                            key={option.id || index}
                            className={`p-2 rounded ${
                              option.isCorrect
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <span className={option.isCorrect ? 'font-medium text-green-800' : 'text-gray-700'}>
                              {option.isCorrect ? '✓ ' : '○ '}
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">คำอธิบาย:</p>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleEditQuestion(question.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="แก้ไข"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {questions.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ไม่พบข้อสอบที่ค้นหา</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

