'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  mockQuestionBank,
  mockQuestionCategories,
  mockQuestions,
  type Question,
  type QuestionCategory,
} from '@/lib/mockData';

export default function QuestionBankPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const filteredQuestions = mockQuestions.filter((question) => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || question.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getCategoryName = (categoryId: string) => {
    return mockQuestionCategories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'ง่าย';
      case 'medium':
        return 'ปานกลาง';
      case 'hard':
        return 'ยาก';
      default:
        return difficulty;
    }
  };

  const handleAddQuestion = () => {
    Swal.fire({
      title: 'เพิ่มข้อสอบใหม่',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  const handleEditQuestion = (questionId: string) => {
    Swal.fire({
      title: 'แก้ไขข้อสอบ',
      text: 'ฟีเจอร์นี้จะพร้อมใช้งานในเร็วๆ นี้',
      icon: 'info',
      confirmButtonText: 'ตกลง',
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณต้องการลบข้อสอบนี้หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ',
          text: 'ข้อสอบถูกลบเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">คลังข้อสอบ</h1>
          <p className="text-gray-600 mt-1">จัดการและจัดหมวดหมู่ข้อสอบทั้งหมด</p>
        </div>
        <Button onClick={handleAddQuestion}>
          <PlusIcon className="h-5 w-5 mr-2 inline" />
          เพิ่มข้อสอบใหม่
        </Button>
      </div>

      {/* Question Bank Info */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{mockQuestionBank.name}</h2>
            <p className="text-gray-600 mt-1">{mockQuestionBank.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">จำนวนข้อสอบทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-600">{mockQuestions.length} ข้อ</p>
          </div>
        </div>
      </Card>

      {/* Categories Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {mockQuestionCategories.map((category) => (
          <Card key={category.id} hover>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{category.name}</p>
              <p className="text-2xl font-bold text-gray-900">{category.questionCount}</p>
              <p className="text-xs text-gray-400 mt-1">ข้อสอบ</p>
            </div>
          </Card>
        ))}
      </div>

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
            {mockQuestionCategories.map((cat) => (
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
            <option value="easy">ง่าย</option>
            <option value="medium">ปานกลาง</option>
            <option value="hard">ยาก</option>
          </select>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <Card key={question.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {getCategoryName(question.category)}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {question.points} คะแนน
                  </span>
                </div>
                <p className="text-gray-900 font-medium mb-3">{question.question}</p>
                {question.type === 'multiple_choice' && question.options && (
                  <div className="ml-8 space-y-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
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

      {filteredQuestions.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบข้อสอบที่ค้นหา</p>
          </div>
        </Card>
      )}
    </div>
  );
}

