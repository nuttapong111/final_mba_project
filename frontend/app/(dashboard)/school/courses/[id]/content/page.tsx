'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PlusIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { type Lesson, type LessonContent, type Poll, type QuestionCategory, type ExamQuestionSelection, type QuizSettings } from '@/lib/mockData';
import { coursesApi, pollsApi, uploadApi, questionBanksApi, assignmentsApi } from '@/lib/api';

// Component สำหรับการตั้งค่าข้อสอบ
function QuizSettingsForm({
  lessonIndex,
  contentIndex,
  content,
  courseId,
  onUpdate,
}: {
  lessonIndex: number;
  contentIndex: number;
  content: LessonContent;
  courseId: string;
  onUpdate: (lessonIndex: number, contentIndex: number, field: string, value: any) => void;
}) {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [questionBankId, setQuestionBankId] = useState<string | null>(null);
  const [difficultyCounts, setDifficultyCounts] = useState<Record<string, Record<string, number>>>({}); // { categoryId: { easy: 5, medium: 3, hard: 2 } }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await questionBanksApi.getByCourse(courseId);
        if (response.success && response.data) {
          setQuestionBankId(response.data.id);
          const categoriesFromApi = response.data.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            courseId: courseId,
            questionCount: cat._count?.questions || 0,
            createdAt: cat.createdAt || new Date().toISOString(),
          }));
          setCategories(categoriesFromApi);
          
          // Fetch question counts by difficulty for each category
          if (response.data.id) {
            const counts: Record<string, Record<string, number>> = {};
            for (const cat of categoriesFromApi) {
              try {
                const [easyRes, mediumRes, hardRes] = await Promise.all([
                  questionBanksApi.getQuestions(response.data.id, { categoryId: cat.id, difficulty: 'easy' }),
                  questionBanksApi.getQuestions(response.data.id, { categoryId: cat.id, difficulty: 'medium' }),
                  questionBanksApi.getQuestions(response.data.id, { categoryId: cat.id, difficulty: 'hard' }),
                ]);
                counts[cat.id] = {
                  easy: easyRes.success ? easyRes.data.length : 0,
                  medium: mediumRes.success ? mediumRes.data.length : 0,
                  hard: hardRes.success ? hardRes.data.length : 0,
                };
              } catch (error) {
                console.error(`Error fetching difficulty counts for category ${cat.id}:`, error);
                counts[cat.id] = { easy: 0, medium: 0, hard: 0 };
              }
            }
            setDifficultyCounts(counts);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [courseId]);
  const quizSettings = content.quizSettings || {
    totalQuestions: 0,
    categorySelections: [],
    duration: 60,
    maxAttempts: 0,
    timeRestriction: 'always' as const,
    examType: undefined,
  };

  const handleUpdateQuizSettings = (field: keyof QuizSettings, value: any) => {
    const updated = {
      ...quizSettings,
      [field]: value,
    };
    onUpdate(lessonIndex, contentIndex, 'quizSettings', updated);
  };

  const handleAddCategorySelection = () => {
    if (categories.length === 0) return;
    const newSelection: ExamQuestionSelection = {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      questionCount: 1,
    };
    handleUpdateQuizSettings('categorySelections', [...(quizSettings.categorySelections || []), newSelection]);
  };

  const handleUpdateCategorySelection = (index: number, field: keyof ExamQuestionSelection, value: any) => {
    const updated = [...(quizSettings.categorySelections || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleUpdateQuizSettings('categorySelections', updated);
  };

  const handleRemoveCategorySelection = (index: number) => {
    const updated = [...(quizSettings.categorySelections || [])];
    updated.splice(index, 1);
    handleUpdateQuizSettings('categorySelections', updated);
  };

  // คำนวณจำนวนข้อทั้งหมดจาก category selections
  const calculatedTotal = (quizSettings.categorySelections || []).reduce(
    (sum, sel) => sum + (sel.questionCount || 0),
    0
  );

  return (
    <div className="ml-8 mt-4 space-y-4 p-4 bg-white rounded-lg border border-blue-200">
      <h4 className="font-bold text-gray-900 mb-4">ตั้งค่าข้อสอบ</h4>

      {/* ประเภทข้อสอบ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          ประเภทข้อสอบ *
        </label>
        <select
          value={quizSettings.examType || ''}
          onChange={(e) => handleUpdateQuizSettings('examType', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
          required
        >
          <option value="">-- เลือกประเภทข้อสอบ --</option>
          <option value="QUIZ">ข้อสอบในบทเรียน</option>
          <option value="MIDTERM">ข้อสอบกลางภาค</option>
          <option value="FINAL">ข้อสอบปลายภาค</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          เลือกประเภทข้อสอบที่ต้องการสร้าง
        </p>
      </div>

      {/* จำนวนข้อทั้งหมด */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            จำนวนข้อทั้งหมด
          </label>
          <input
            type="number"
            min="1"
            value={quizSettings.totalQuestions || ''}
            onChange={(e) => handleUpdateQuizSettings('totalQuestions', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="เช่น 50"
          />
          {calculatedTotal > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              จำนวนข้อจากหมวดหมู่: {calculatedTotal} ข้อ
            </p>
          )}
        </div>

        {/* เวลาในการทำแบบทดสอบ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            เวลาในการทำแบบทดสอบ (นาที) *
          </label>
          <input
            type="number"
            min="1"
            value={quizSettings.duration || ''}
            onChange={(e) => handleUpdateQuizSettings('duration', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="เช่น 60"
            required
          />
        </div>
      </div>

      {/* จำนวนครั้งที่สามารถสอบซ้ำได้ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          จำนวนครั้งที่สามารถสอบซ้ำได้
        </label>
        <input
          type="number"
          min="0"
          value={quizSettings.maxAttempts || ''}
          onChange={(e) => handleUpdateQuizSettings('maxAttempts', parseInt(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="0 = ไม่จำกัด"
        />
        <p className="text-xs text-gray-500 mt-1">
          ใส่ 0 สำหรับไม่จำกัดจำนวนครั้ง
        </p>
      </div>

      {/* เวลาที่สามารถสอบได้ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          เวลาที่สามารถสอบได้
        </label>
        <div className="flex space-x-4 mb-3">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`time-restriction-${lessonIndex}-${contentIndex}`}
              checked={quizSettings.timeRestriction === 'always'}
              onChange={() => handleUpdateQuizSettings('timeRestriction', 'always')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">เปิดให้สอบได้ตลอด</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name={`time-restriction-${lessonIndex}-${contentIndex}`}
              checked={quizSettings.timeRestriction === 'scheduled'}
              onChange={() => handleUpdateQuizSettings('timeRestriction', 'scheduled')}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">มีเวลาสอบชัดเจน</span>
          </label>
        </div>

        {quizSettings.timeRestriction === 'scheduled' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                วันที่เริ่มสอบ
              </label>
              <input
                type="date"
                value={quizSettings.startDate || ''}
                onChange={(e) => handleUpdateQuizSettings('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เวลาเริ่มสอบ
              </label>
              <input
                type="time"
                value={quizSettings.startTime || ''}
                onChange={(e) => handleUpdateQuizSettings('startTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                วันที่สิ้นสุดสอบ
              </label>
              <input
                type="date"
                value={quizSettings.endDate || ''}
                onChange={(e) => handleUpdateQuizSettings('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เวลาสิ้นสุดสอบ
              </label>
              <input
                type="time"
                value={quizSettings.endTime || ''}
                onChange={(e) => handleUpdateQuizSettings('endTime', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* เลือกข้อแต่ละหมวดมากี่ข้อ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            เลือกข้อแต่ละหมวดมากี่ข้อ
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCategorySelection}
            disabled={categories.length === 0}
          >
            <PlusIcon className="h-4 w-4 mr-1 inline" />
            เพิ่มหมวดหมู่
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ยังไม่มีหมวดหมู่ กรุณาไปที่แท็บ "หมวดหมู่" เพื่อเพิ่มหมวดหมู่ก่อน
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(quizSettings.categorySelections || []).map((selection, index) => {
              const category = categories.find(cat => cat.id === selection.categoryId);
              const difficultyCount = selection.categoryId && selection.difficulty 
                ? difficultyCounts[selection.categoryId]?.[selection.difficulty] || 0
                : null;
              const maxQuestions = selection.difficulty && difficultyCount !== null
                ? difficultyCount
                : category?.questionCount || 0;
              const hasInsufficientQuestions = selection.difficulty && difficultyCount !== null 
                && selection.questionCount > difficultyCount;

              return (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        หมวดหมู่
                      </label>
                      <select
                        value={selection.categoryId}
                        onChange={(e) => {
                          const selectedCategory = categories.find(cat => cat.id === e.target.value);
                          if (selectedCategory) {
                            handleUpdateCategorySelection(index, 'categoryId', e.target.value);
                            handleUpdateCategorySelection(index, 'categoryName', selectedCategory.name);
                            // Reset difficulty and question count when category changes
                            handleUpdateCategorySelection(index, 'difficulty', undefined);
                            handleUpdateCategorySelection(index, 'questionCount', 1);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name} ({cat.questionCount} ข้อ)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        ระดับความยาก
                      </label>
                      <select
                        value={selection.difficulty || ''}
                        onChange={(e) => {
                          const newDifficulty = e.target.value || undefined;
                          handleUpdateCategorySelection(index, 'difficulty', newDifficulty);
                          
                          // Reset question count if it exceeds available questions for selected difficulty
                          if (newDifficulty && selection.categoryId) {
                            const availableCount = difficultyCounts[selection.categoryId]?.[newDifficulty] || 0;
                            if (selection.questionCount > availableCount) {
                              handleUpdateCategorySelection(index, 'questionCount', Math.max(1, availableCount));
                            }
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="easy">ง่าย</option>
                        <option value="medium">ปานกลาง</option>
                        <option value="hard">ยาก</option>
                      </select>
                      {selection.difficulty && difficultyCount !== null && (
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          มี {difficultyCount} ข้อ
                        </p>
                      )}
                      {!selection.difficulty && (
                        <p className="text-xs text-gray-500 mt-1">
                          เลือกระดับความยาก (ถ้าไม่เลือกจะสุ่มทั้งหมด)
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        จำนวนข้อ
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={maxQuestions}
                        value={selection.questionCount || ''}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 0;
                          handleUpdateCategorySelection(index, 'questionCount', Math.min(count, maxQuestions));
                        }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                          hasInsufficientQuestions 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      {hasInsufficientQuestions && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ จำนวนข้อที่เลือก ({selection.questionCount}) มากกว่าจำนวนข้อที่มีในระดับความยากนี้ ({difficultyCount} ข้อ)
                        </p>
                      )}
                      {!hasInsufficientQuestions && category && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selection.difficulty 
                            ? `สูงสุด ${maxQuestions} ข้อ (ในระดับความยากนี้)`
                            : `สูงสุด ${maxQuestions} ข้อ`
                          }
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCategorySelection(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {(quizSettings.categorySelections || []).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                ยังไม่ได้เลือกหมวดหมู่ คลิก "เพิ่มหมวดหมู่" เพื่อเริ่มต้น
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseContentPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize lessons - include all lessons (pre_test can be in any lesson)
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error' | 'warning'; message: string; data?: any }>>([]);
  
  // Helper function to add debug log
  const addDebugLog = (type: 'info' | 'success' | 'error' | 'warning', message: string, data?: any) => {
    const log = {
      time: new Date().toLocaleTimeString('th-TH'),
      type,
      message,
      data,
    };
    setDebugLogs(prev => [...prev, log]);
    // Keep only last 50 logs
    if (debugLogs.length >= 50) {
      setDebugLogs(prev => prev.slice(-49));
    }
  };

  useEffect(() => {
    fetchCourseContent();
  }, [courseId]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getById(courseId);
      if (response.success && response.data) {
        setCourse(response.data);
        // Transform API data to match frontend format
        const transformedLessons = ((response.data as any).lessons || []).map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          contents: (lesson.contents || []).map((content: any) => {
            // แปลง fileUrl ให้เป็น full URL ถ้าเป็น relative path
            let fileUrl = content.fileUrl;
            if (fileUrl && fileUrl.startsWith('/uploads/')) {
              const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
              // ลบ /api ออกเพราะ fileUrl เริ่มด้วย /uploads/ แล้ว
              const baseUrl = apiBaseUrl.replace('/api', '');
              fileUrl = `${baseUrl}${fileUrl}`;
            }
            
            return {
              id: content.id,
              type: content.type.toLowerCase(),
              title: content.title,
              url: content.url,
              fileUrl: fileUrl,
              fileName: content.fileName,
              fileSize: content.fileSize,
              duration: content.duration,
              order: content.order,
              file: undefined, // เก็บไฟล์จริงสำหรับอัพโหลด
              quizSettings: content.quizSettings ? {
              totalQuestions: content.quizSettings.totalQuestions,
              duration: content.quizSettings.duration,
              maxAttempts: content.quizSettings.maxAttempts,
              timeRestriction: content.quizSettings.timeRestriction,
              startDate: content.quizSettings.startDate,
              startTime: content.quizSettings.startTime,
              endDate: content.quizSettings.endDate,
              endTime: content.quizSettings.endTime,
              passingPercentage: content.quizSettings.passingPercentage,
              examType: content.quizSettings.examType || null,
              categorySelections: (content.quizSettings.categorySelections || []).map((sel: any) => ({
                categoryId: sel.categoryId,
                categoryName: sel.categoryName,
                questionCount: sel.questionCount,
                difficulty: sel.difficulty?.toLowerCase(),
              })),
              } : undefined,
              poll: content.poll ? {
                id: content.poll.id,
                title: content.poll.title,
                description: content.poll.description,
                questions: content.poll.questions || [],
              } : undefined,
              assignment: content.assignment ? {
                id: content.assignment.id,
                title: content.assignment.title,
                description: content.assignment.description,
                dueDate: content.assignment.dueDate,
                maxScore: content.assignment.maxScore,
              } : undefined,
            };
          }),
        }));
        setLessons(transformedLessons);
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...lessons];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated[index - 1].order = index;
    updated[index].order = index + 1;
    setLessons(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === lessons.length - 1) return;
    const updated = [...lessons];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated[index].order = index + 1;
    updated[index + 1].order = index + 2;
    setLessons(updated);
  };

  const handleMoveContentUp = (lessonIndex: number, contentIndex: number) => {
    if (contentIndex === 0) return;
    const updated = [...lessons];
    const contents = [...updated[lessonIndex].contents];
    [contents[contentIndex - 1], contents[contentIndex]] = [contents[contentIndex], contents[contentIndex - 1]];
    contents[contentIndex - 1].order = contentIndex;
    contents[contentIndex].order = contentIndex + 1;
    updated[lessonIndex].contents = contents;
    setLessons(updated);
  };

  const handleMoveContentDown = (lessonIndex: number, contentIndex: number) => {
    const updated = [...lessons];
    const contents = [...updated[lessonIndex].contents];
    if (contentIndex === contents.length - 1) return;
    [contents[contentIndex], contents[contentIndex + 1]] = [contents[contentIndex + 1], contents[contentIndex]];
    contents[contentIndex].order = contentIndex + 1;
    contents[contentIndex + 1].order = contentIndex + 2;
    updated[lessonIndex].contents = contents;
    setLessons(updated);
  };


  const handleAddContent = (lessonIndex: number, type: LessonContent['type']) => {
    const updated = [...lessons];
    const newContent: LessonContent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      title: type === 'pre_test' ? 'แบบทดสอบก่อนเรียน' : 
            type === 'quiz' ? 'แบบทดสอบ' : 
            type === 'assignment' ? 'การบ้าน' : '',
      order: updated[lessonIndex].contents.length + 1,
    };
    updated[lessonIndex].contents.push(newContent);
    setLessons(updated);
  };

  const handleAddLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      courseId: courseId,
      title: `บทเรียน ${lessons.length + 1}`,
      order: lessons.length + 1,
      contents: [],
      createdAt: new Date().toISOString(),
    };
    setLessons([...lessons, newLesson]);
  };

  const handleRemoveLesson = (lessonIndex: number) => {
    const updated = lessons.filter((_, i) => i !== lessonIndex);
    // Reorder lessons
    updated.forEach((lesson, i) => {
      lesson.order = i + 1;
    });
    setLessons(updated);
  };

  const handleUpdateLesson = (lessonIndex: number, field: string, value: any) => {
    const updated = [...lessons];
    updated[lessonIndex] = {
      ...updated[lessonIndex],
      [field]: value,
    };
    setLessons(updated);
  };

  const handleUpdateContent = (lessonIndex: number, contentIndex: number, field: string, value: any) => {
    const updated = [...lessons];
    updated[lessonIndex].contents[contentIndex] = {
      ...updated[lessonIndex].contents[contentIndex],
      [field]: value,
    };
    setLessons(updated);
  };

  const handleRemoveContent = (lessonIndex: number, contentIndex: number) => {
    const updated = [...lessons];
    updated[lessonIndex].contents = updated[lessonIndex].contents.filter((_, i) => i !== contentIndex);
    // Reorder
    updated[lessonIndex].contents.forEach((content, i) => {
      content.order = i + 1;
    });
    setLessons(updated);
  };

  const [availablePolls, setAvailablePolls] = useState<Array<{ id: string; title: string; poll: Poll }>>([]);
  const [availableAssignments, setAvailableAssignments] = useState<Array<{ id: string; title: string; assignment: any }>>([]);

  // ดึง polls ทั้งหมดที่สร้างไว้แล้วจาก API
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await pollsApi.getByCourse(courseId);
        if (response.success && response.data) {
          // แปลงข้อมูลจาก API เป็นรูปแบบที่ใช้ในหน้า content
          const polls = response.data.map((item: any) => ({
            id: item.poll.id,
            title: item.poll.title,
            poll: item.poll,
          }));
          setAvailablePolls(polls);
        }
      } catch (error) {
        console.error('Error fetching polls:', error);
      }
    };

    fetchPolls();
  }, [courseId]);

  // ดึง assignments ทั้งหมดที่สร้างไว้แล้วจาก API
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await assignmentsApi.getByCourse(courseId);
        if (response.success && response.data) {
          // แปลงข้อมูลจาก API เป็นรูปแบบที่ใช้ในหน้า content
          const assignments = response.data.map((assignment: any) => ({
            id: assignment.id,
            title: assignment.title,
            assignment: assignment,
          }));
          setAvailableAssignments(assignments);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
    };

    fetchAssignments();
  }, [courseId]);

  const handleSelectPoll = (lessonIndex: number, contentIndex: number, pollId: string) => {
    const selectedPoll = availablePolls.find(p => p.poll.id === pollId);
    if (selectedPoll) {
      const updated = [...lessons];
      updated[lessonIndex].contents[contentIndex] = {
        ...updated[lessonIndex].contents[contentIndex],
        poll: selectedPoll.poll,
        title: selectedPoll.title || selectedPoll.poll.title,
      };
      setLessons(updated);
    }
  };

  const handleSelectAssignment = (lessonIndex: number, contentIndex: number, assignmentId: string) => {
    const selectedAssignment = availableAssignments.find(a => a.assignment.id === assignmentId);
    if (selectedAssignment) {
      const updated = [...lessons];
      updated[lessonIndex].contents[contentIndex] = {
        ...updated[lessonIndex].contents[contentIndex],
        assignment: selectedAssignment.assignment,
        title: selectedAssignment.title || selectedAssignment.assignment.title,
      };
      setLessons(updated);
    }
  };

  const handleSave = async () => {
    try {
      // อัพโหลดไฟล์ใหม่ก่อน และเก็บข้อมูลไฟล์ไว้ใน map
      const fileUploadResults = new Map<string, { fileUrl: string; fileName: string; fileSize: number; s3Key?: string }>();
      const uploadPromises: Array<Promise<void>> = [];
      
      lessons.forEach((lesson, lessonIndex) => {
        lesson.contents.forEach((content, contentIndex) => {
          // ตรวจสอบว่ามีไฟล์ใหม่ที่ต้องอัพโหลด
          const hasNewFile = (content as any).file && !content.url?.trim();
          const hasExistingFileUrl = content.fileUrl && !content.url?.trim();
          
          const debugInfo = {
            hasNewFile,
            hasExistingFileUrl,
            fileUrl: content.fileUrl,
            fileName: content.fileName,
            fileSize: content.fileSize,
            url: content.url,
          };
          console.log(`[DEBUG] Content ${lessonIndex}-${contentIndex} (${content.type}):`, debugInfo);
          addDebugLog('info', `ตรวจสอบ Content ${lessonIndex}-${contentIndex} (${content.type})`, debugInfo);
          
          // ถ้ามีไฟล์ใหม่ (file object) และยังไม่มี URL
          if (hasNewFile) {
            const file = (content as any).file as File;
            const fileType = content.type === 'video' ? 'video' : 'document';
            const contentKey = `${lessonIndex}-${contentIndex}`;
            
            const uploadInfo = {
              fileName: file.name,
              fileSize: file.size,
              fileType,
            };
            console.log(`[DEBUG] Uploading file for ${contentKey}:`, uploadInfo);
            addDebugLog('info', `กำลังอัพโหลดไฟล์: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, uploadInfo);
            
            const fileKey = `${lessonIndex}-${contentIndex}`;
            uploadPromises.push(
              uploadApi.uploadFile(file, fileType, (progress) => {
                // Update progress in debug log
                addDebugLog('info', `อัพโหลดไฟล์ ${file.name}: ${progress}%`, { progress });
                // Update progress map (will be used by Swal progress bar)
                if (typeof window !== 'undefined') {
                  const progressMap = (window as any).uploadProgressMap;
                  if (progressMap) {
                    progressMap.set(fileKey, progress);
                  }
                }
              })
                .then((response) => {
                  if (response.success && response.data) {
                    console.log(`[DEBUG] Upload success for ${contentKey}:`, response.data);
                    addDebugLog('success', `อัพโหลดไฟล์สำเร็จ: ${response.data.fileName}`, response.data);
                    
                    // แปลง fileUrl ให้เป็น full URL ถ้าเป็น relative path
                    let fileUrl = response.data.url;
                    if (fileUrl && fileUrl.startsWith('/uploads/')) {
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                      const baseUrl = apiBaseUrl.replace('/api', '');
                      fileUrl = `${baseUrl}${fileUrl}`;
                    }
                    
                    // เก็บข้อมูลไฟล์ไว้ใน map - ใช้ contentKey ที่ตรงกับตอน prepare data
                    // contentKey ใช้ `${lessonIndex}-${contentIndex}` ซึ่งจะตรงกับตอน prepare data
                    fileUploadResults.set(contentKey, {
                      fileUrl: response.data.url, // เก็บ relative path สำหรับส่งไป backend
                      fileName: response.data.fileName,
                      fileSize: response.data.fileSize,
                      s3Key: response.data.s3Key, // เก็บ S3 key สำหรับลบไฟล์
                    });
                    
                    console.log(`[DEBUG] Stored in map with key: ${contentKey}`, fileUploadResults.get(contentKey));
                    
                    const storedData = fileUploadResults.get(contentKey);
                    console.log(`[DEBUG] Stored in map for ${contentKey}:`, storedData);
                    addDebugLog('info', `เก็บข้อมูลไฟล์ใน Map: ${contentKey}`, storedData);
                    
                    // อัพเดต state สำหรับแสดงใน UI
                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', fileUrl);
                    handleUpdateContent(lessonIndex, contentIndex, 'fileName', response.data.fileName);
                    handleUpdateContent(lessonIndex, contentIndex, 'fileSize', response.data.fileSize);
                    // ลบ file object ออก
                    handleUpdateContent(lessonIndex, contentIndex, 'file', undefined);
                  } else {
                    throw new Error(response.error || 'ไม่สามารถอัพโหลดไฟล์ได้');
                  }
                })
                .catch((error) => {
                  console.error(`[DEBUG] Upload error for ${contentKey}:`, error);
                  addDebugLog('error', `อัพโหลดไฟล์ล้มเหลว: ${content.title}`, error.message);
                  throw new Error(`ไม่สามารถอัพโหลดไฟล์ "${content.title}": ${error.message}`);
                })
            );
          }
        });
      });

      // รอให้อัพโหลดไฟล์เสร็จก่อน
      if (uploadPromises.length > 0) {
        // Create progress map accessible from upload callbacks
        const uploadProgress = new Map<string, number>();
        if (typeof window !== 'undefined') {
          (window as any).uploadProgressMap = uploadProgress;
        }
        
        let progressInterval: NodeJS.Timeout | null = null;
        
        // Show upload dialog
        const uploadDialog = Swal.fire({
          title: 'กำลังอัพโหลดไฟล์...',
          html: `
            <div class="text-center">
              <p class="mb-4">กำลังอัพโหลด ${uploadPromises.length} ไฟล์ กรุณารอสักครู่</p>
              <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div id="upload-progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
              </div>
              <p id="upload-progress-text" class="text-sm text-gray-600">0%</p>
              <p class="text-xs text-gray-500 mt-2">หากอัพโหลดนานเกิน 5 นาที กรุณาตรวจสอบการเชื่อมต่อ</p>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
          didOpen: () => {
            // Update progress periodically
            progressInterval = setInterval(() => {
              const totalProgress = uploadProgress.size > 0
                ? Array.from(uploadProgress.values()).reduce((sum, p) => sum + p, 0) / uploadPromises.length
                : 0;
              const progressBar = document.getElementById('upload-progress-bar');
              const progressText = document.getElementById('upload-progress-text');
              if (progressBar && progressText) {
                progressBar.style.width = `${totalProgress}%`;
                progressText.textContent = `${Math.round(totalProgress)}%`;
              }
            }, 100);
          },
        });

        try {
          console.log('[DEBUG] Waiting for upload promises to complete...');
          await Promise.all(uploadPromises);
          console.log('[DEBUG] All uploads completed successfully');
          
          // Clear progress interval
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          if (typeof window !== 'undefined') {
            delete (window as any).uploadProgressMap;
          }
          
          // Close upload dialog
          console.log('[DEBUG] Closing upload dialog...');
          if (Swal.isVisible()) {
            await Swal.close();
            console.log('[DEBUG] Upload dialog closed');
          } else {
            console.log('[DEBUG] Upload dialog is not visible, skipping close');
          }
          
          // รอให้ state อัพเดต (ใช้ setTimeout เพื่อให้ React re-render)
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error('[DEBUG] Upload error:', error);
          console.error('[DEBUG] Error response:', error.response?.data);
          console.error('[DEBUG] Error status:', error.response?.status);
          
          // Clear progress interval
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          if (typeof window !== 'undefined') {
            delete (window as any).uploadProgressMap;
          }
          
          // Close upload dialog
          console.log('[DEBUG] Closing upload dialog due to error...');
          if (Swal.isVisible()) {
            await Swal.close();
            console.log('[DEBUG] Upload dialog closed');
          }
          
          // Extract detailed error message
          const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถอัพโหลดไฟล์ได้';
          const errorDetails = error.response?.data ? JSON.stringify(error.response.data, null, 2) : '';
          
          addDebugLog('error', 'อัพโหลดไฟล์ล้มเหลว', {
            message: errorMessage,
            status: error.response?.status,
            details: errorDetails,
          });
          
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            html: `
              <div style="text-align: left;">
                <p><strong>${errorMessage}</strong></p>
                ${error.response?.status ? `<p style="color: #666; font-size: 0.9em;">HTTP Status: ${error.response.status}</p>` : ''}
                ${errorDetails ? `<details style="margin-top: 10px;"><summary style="cursor: pointer; color: #666;">รายละเอียดเพิ่มเติม</summary><pre style="text-align: left; font-size: 0.8em; margin-top: 5px;">${errorDetails}</pre></details>` : ''}
              </div>
            `,
            width: '600px',
          });
          return;
        }
      }

      // Debug: Log data before sending
      console.log('[DEBUG] Lessons data to save:', JSON.stringify(lessons, null, 2));
      addDebugLog('info', 'เตรียมส่งข้อมูลไป API', { lessonCount: lessons.length, contentCount: lessons.reduce((sum, l) => sum + l.contents.length, 0) });

      // Prepare lessons data for API
      // IMPORTANT: ใช้ index ที่ตรงกับ lessonIndex ใน loop อัพโหลดไฟล์
      const lessonsData = lessons.map((lesson, lessonIndex) => ({
        title: lesson.title,
        description: lesson.description || '',
        order: lessonIndex + 1,
        contents: lesson.contents.map((content, contentIndex) => {
          const contentKey = `${lessonIndex}-${contentIndex}`;
          const contentData: any = {
            type: content.type,
            title: content.title,
            order: contentIndex + 1,
          };

          // ถ้ามี URL ให้ใช้ URL (สำหรับ YouTube/Vimeo หรือไฟล์ที่อัพโหลดแล้ว)
          if (content.url && content.url.trim()) {
            contentData.url = content.url;
          }
          
          // ตรวจสอบว่ามีไฟล์ที่เพิ่งอัพโหลดใน map หรือไม่
          const uploadedFile = fileUploadResults.get(contentKey);
          const prepareInfo = {
            hasUploadedFile: !!uploadedFile,
            uploadedFile,
            contentFileUrl: content.fileUrl,
            contentFileName: content.fileName,
            contentFileSize: content.fileSize,
          };
          console.log(`[DEBUG] Preparing content ${contentKey}:`, prepareInfo);
          addDebugLog('info', `เตรียมข้อมูล Content ${contentKey} (${content.type})`, prepareInfo);
          
          if (uploadedFile) {
            // ใช้ข้อมูลจาก upload result (เป็น relative path แล้ว)
            console.log(`[DEBUG] Using uploaded file data for ${contentKey}`);
            addDebugLog('success', `ใช้ข้อมูลไฟล์จาก Map: ${contentKey}`, uploadedFile);
            contentData.fileUrl = uploadedFile.fileUrl;
            contentData.fileName = uploadedFile.fileName;
            contentData.fileSize = uploadedFile.fileSize;
            contentData.s3Key = uploadedFile.s3Key; // ส่ง S3 key ไป backend
          } else if (content.fileUrl) {
            // ถ้า fileUrl เป็น URL จาก backend (http/https หรือ /uploads/) ให้ใช้
            // แต่ต้องแปลงเป็น relative path สำหรับส่งไป backend
            console.log(`[DEBUG] Using existing fileUrl for ${contentKey}:`, content.fileUrl);
            addDebugLog('info', `ใช้ fileUrl ที่มีอยู่: ${contentKey}`, content.fileUrl);
            let fileUrl = content.fileUrl;
            if (fileUrl.startsWith('http')) {
              // แปลง full URL กลับเป็น relative path
              const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
              const baseUrl = apiBaseUrl.replace('/api', '');
              if (fileUrl.startsWith(baseUrl)) {
                fileUrl = fileUrl.replace(baseUrl, '');
              }
            }
            contentData.fileUrl = fileUrl;
            if (content.fileName) contentData.fileName = content.fileName;
            if (content.fileSize) contentData.fileSize = content.fileSize;
          } else {
            console.log(`[DEBUG] No file data for ${contentKey} (type: ${content.type})`);
            addDebugLog('warning', `ไม่มีข้อมูลไฟล์สำหรับ ${contentKey} (type: ${content.type})`);
          }
          
          if (content.duration) contentData.duration = content.duration;
          if (content.poll?.id) {
            contentData.pollId = content.poll.id;
            console.log(`[DEBUG] Saving pollId: ${content.poll.id} for content: ${content.title}`);
          }
          if (content.assignment?.id) {
            contentData.assignmentId = content.assignment.id;
            console.log(`[DEBUG] Saving assignmentId: ${content.assignment.id} for content: ${content.title}`);
          }

          // Add quiz settings if exists
          if (content.quizSettings) {
            contentData.quizSettings = {
              totalQuestions: content.quizSettings.totalQuestions || null,
              duration: content.quizSettings.duration || null,
              maxAttempts: content.quizSettings.maxAttempts || 0,
              timeRestriction: content.quizSettings.timeRestriction || 'always',
              startDate: content.quizSettings.startDate || null,
              startTime: content.quizSettings.startTime || null,
              endDate: content.quizSettings.endDate || null,
              endTime: content.quizSettings.endTime || null,
              passingPercentage: (content.quizSettings as any).passingPercentage || 70,
              categorySelections: (content.quizSettings.categorySelections || []).map(
                (selection: any) => ({
                  categoryId: selection.categoryId,
                  categoryName: selection.categoryName,
                  questionCount: selection.questionCount,
                  difficulty: selection.difficulty || null,
                })
              ),
            };
          }

          return contentData;
        }),
      }));

      // Debug: Log data being sent to API
      console.log('[DEBUG] Sending to API:', JSON.stringify(lessonsData, null, 2));
      console.log('[DEBUG] File upload results map:', Array.from(fileUploadResults.entries()));
      addDebugLog('info', 'กำลังส่งข้อมูลไป API', {
        lessonCount: lessonsData.length,
        fileUploadResultsCount: fileUploadResults.size,
        fileUploadResults: Array.from(fileUploadResults.entries()),
      });

      const response = await coursesApi.saveContent(courseId, lessonsData);

      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'บันทึกสำเร็จ!',
          text: response.message || 'เนื้อหาหลักสูตรถูกบันทึกเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
        });
        // Refresh page to load saved data
        window.location.reload();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถบันทึกข้อมูลได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.response?.data?.error || error.message || 'ไม่สามารถบันทึกข้อมูลได้',
      });
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'quiz': return '📋';
      case 'pre_test': return '📝';
      case 'poll': return '📊';
      case 'assignment': return '📝';
      default: return '📎';
    }
  };

  const getContentLabel = (type: string) => {
    switch (type) {
      case 'video': return 'วิดีโอ';
      case 'document': return 'เอกสาร';
      case 'quiz': return 'ข้อสอบ';
      case 'pre_test': return 'ทดสอบก่อนเรียน';
      case 'poll': return 'แบบประเมิน';
      case 'assignment': return 'การบ้าน';
      default: return type;
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการเนื้อหาหลักสูตร</h2>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="text-xs"
          >
            {showDebugPanel ? 'ซ่อน' : 'แสดง'} Debug Panel
          </Button>
          <Button onClick={handleSave}>
            บันทึกการเปลี่ยนแปลง
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <Card className="bg-gray-900 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Debug Panel</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDebugLogs([])}
                className="text-xs bg-gray-800 text-white border-gray-700"
              >
                ล้าง Logs
              </Button>
              <button
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <p className="text-gray-400 text-sm">ยังไม่มี logs</p>
            ) : (
              debugLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded text-sm ${
                    log.type === 'success'
                      ? 'bg-green-900 bg-opacity-50 border-l-4 border-green-500'
                      : log.type === 'error'
                      ? 'bg-red-900 bg-opacity-50 border-l-4 border-red-500'
                      : log.type === 'warning'
                      ? 'bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500'
                      : 'bg-gray-800 bg-opacity-50 border-l-4 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-400">{log.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            log.type === 'success'
                              ? 'bg-green-700 text-green-100'
                              : log.type === 'error'
                              ? 'bg-red-700 text-red-100'
                              : log.type === 'warning'
                              ? 'bg-yellow-700 text-yellow-100'
                              : 'bg-blue-700 text-blue-100'
                          }`}
                        >
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white mb-1">{log.message}</p>
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                            ดูข้อมูลเพิ่มเติม
                          </summary>
                          <pre className="mt-2 p-2 bg-black bg-opacity-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>คำแนะนำ:</strong> คุณสามารถเรียงลำดับบทเรียนและเนื้อหาได้โดยใช้ปุ่มขึ้น/ลง 
          หรือลากวาง (Drag & Drop) เนื้อหาที่เพิ่มหลังข้อสอบหลังเรียนจะแสดงแบบประเมินให้ผู้เรียนกรอก
        </p>
      </div>

      {/* Lessons Section */}
      <div className="space-y-4">
        {lessons.map((lesson, lessonIndex) => (
          <Card key={lesson.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                <Bars3Icon className="h-5 w-5 text-gray-400" />
                <Input
                  value={lesson.title}
                  onChange={(e) => handleUpdateLesson(lessonIndex, 'title', e.target.value)}
                  placeholder="ชื่อบทเรียน"
                  className="text-xl font-bold"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMoveUp(lessonIndex)}
                  disabled={lessonIndex === 0}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronUpIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleMoveDown(lessonIndex)}
                  disabled={lessonIndex === lessons.length - 1}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleRemoveLesson(lessonIndex)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 ml-8">
              {lesson.contents.map((content, contentIndex) => (
                <div key={content.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Bars3Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-xl">{getContentIcon(content.type)}</span>
                    <div className="flex-1">
                      <Input
                        value={content.title}
                        onChange={(e) => handleUpdateContent(lessonIndex, contentIndex, 'title', e.target.value)}
                        placeholder={`ชื่อ${getContentLabel(content.type)}`}
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleMoveContentUp(lessonIndex, contentIndex)}
                        disabled={contentIndex === 0}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveContentDown(lessonIndex, contentIndex)}
                        disabled={contentIndex === lesson.contents.length - 1}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveContent(lessonIndex, contentIndex)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content specific fields */}
                  {(content.type === 'video' || content.type === 'document') && (
                    <div className="ml-8 space-y-2">
                      {content.type === 'video' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              วิธีเพิ่มวิดีโอ
                            </label>
                            <div className="flex space-x-4 mb-3">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`video-source-${lessonIndex}-${contentIndex}`}
                                  checked={!content.fileUrl || content.fileUrl === ''}
                                  onChange={() => {
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileName', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileSize', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'file', undefined);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">ใช้ URL</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`video-source-${lessonIndex}-${contentIndex}`}
                                  checked={content.fileUrl !== undefined && content.fileUrl !== ''}
                                  onChange={() => {
                                    handleUpdateContent(lessonIndex, contentIndex, 'url', undefined);
                                    // Set fileUrl to a placeholder value to enable file upload option
                                    if (!content.fileUrl || content.fileUrl === '') {
                                      handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', 'pending');
                                    }
                                  }}
                                  className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">อัพโหลดไฟล์</span>
                              </label>
                            </div>
                          </div>
                          {!content.fileUrl || content.fileUrl === '' ? (
                            <Input
                              label="URL วิดีโอ"
                              type="url"
                              value={content.url || ''}
                              onChange={(e) => handleUpdateContent(lessonIndex, contentIndex, 'url', e.target.value)}
                              placeholder="https://..."
                            />
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                ไฟล์วิดีโอ
                              </label>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // ตรวจสอบขนาดไฟล์ (สูงสุด 2GB)
                                    if (file.size > 2 * 1024 * 1024 * 1024) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'ไฟล์ใหญ่เกินไป',
                                        text: 'ขนาดไฟล์ไม่ควรเกิน 2GB',
                                      });
                                      return;
                                    }
                                    // ตรวจสอบประเภทไฟล์
                                    if (!file.type.startsWith('video/')) {
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'ประเภทไฟล์ไม่ถูกต้อง',
                                        text: 'กรุณาเลือกไฟล์วิดีโอเท่านั้น',
                                      });
                                      return;
                                    }
                                    // เก็บไฟล์จริงไว้ใน state สำหรับอัพโหลด
                                    handleUpdateContent(lessonIndex, contentIndex, 'file', file);
                                    // สร้าง URL สำหรับแสดงตัวอย่าง (local preview)
                                    const fileUrl = URL.createObjectURL(file);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', fileUrl);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileName', file.name);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileSize', file.size);
                                    
                                    // อ่าน duration จากไฟล์วิดีโออัตโนมัติ
                                    const video = document.createElement('video');
                                    video.preload = 'metadata';
                                    video.onloadedmetadata = () => {
                                      const durationInMinutes = Math.ceil(video.duration / 60);
                                      handleUpdateContent(lessonIndex, contentIndex, 'duration', durationInMinutes);
                                      // Revoke URL หลังจากอ่าน duration แล้ว (แต่ยังต้องเก็บไว้สำหรับ preview)
                                      // ไม่ revoke เพราะยังต้องใช้สำหรับแสดง preview
                                    };
                                    video.onerror = () => {
                                      console.error('Error loading video metadata');
                                    };
                                    video.src = fileUrl;
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                              {content.fileUrl && content.fileUrl !== 'pending' && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">📹</span>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-700 font-medium">
                                          {content.fileName || 'ไฟล์วิดีโอที่เลือก'}
                                        </span>
                                        {content.fileSize && (
                                          <span className="text-xs text-gray-500">
                                            {formatFileSize(content.fileSize)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateContent(lessonIndex, contentIndex, 'file', undefined);
                                        handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', undefined);
                                        handleUpdateContent(lessonIndex, contentIndex, 'fileName', undefined);
                                        handleUpdateContent(lessonIndex, contentIndex, 'fileSize', undefined);
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* แสดงฟิลด์ duration เฉพาะเมื่อใช้ URL (เพราะอ่านจากไฟล์ได้อัตโนมัติ) */}
                          {(!content.fileUrl || content.fileUrl === '') && (
                            <Input
                              label="ระยะเวลา (นาที)"
                              type="number"
                              value={content.duration || ''}
                              onChange={(e) => handleUpdateContent(lessonIndex, contentIndex, 'duration', parseInt(e.target.value))}
                              placeholder="45"
                            />
                          )}
                          {/* แสดง duration ที่อ่านได้จากไฟล์อัตโนมัติ (read-only) */}
                          {content.fileUrl && content.fileUrl !== '' && content.duration && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">ระยะเวลา:</span> {content.duration} นาที (อ่านจากไฟล์อัตโนมัติ)
                            </div>
                          )}
                        </>
                      )}
                      {content.type === 'document' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ไฟล์เอกสาร
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // ตรวจสอบขนาดไฟล์ (สูงสุด 100MB)
                                if (file.size > 100 * 1024 * 1024) {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'ไฟล์ใหญ่เกินไป',
                                    text: 'ขนาดไฟล์ไม่ควรเกิน 100MB',
                                  });
                                  return;
                                }
                                // ตรวจสอบประเภทไฟล์
                                const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                if (!allowedTypes.includes(file.type)) {
                                  Swal.fire({
                                    icon: 'error',
                                    title: 'ประเภทไฟล์ไม่ถูกต้อง',
                                    text: 'กรุณาเลือกไฟล์ PDF, DOC หรือ DOCX เท่านั้น',
                                  });
                                  return;
                                }
                                // เก็บไฟล์จริงไว้ใน state สำหรับอัพโหลด
                                handleUpdateContent(lessonIndex, contentIndex, 'file', file);
                                // สร้าง URL สำหรับแสดงตัวอย่าง (local preview)
                                const fileUrl = URL.createObjectURL(file);
                                handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', fileUrl);
                                handleUpdateContent(lessonIndex, contentIndex, 'fileName', file.name);
                                handleUpdateContent(lessonIndex, contentIndex, 'fileSize', file.size);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          />
                          {content.fileUrl && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">📄</span>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-700 font-medium">
                                      {content.fileName || 'ไฟล์เอกสารที่เลือก'}
                                    </span>
                                    {content.fileSize && (
                                      <span className="text-xs text-gray-500">
                                        {formatFileSize(content.fileSize)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateContent(lessonIndex, contentIndex, 'file', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileName', undefined);
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileSize', undefined);
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  ลบ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Settings */}
                  {(content.type === 'quiz' || content.type === 'pre_test') && (
                    <QuizSettingsForm
                      lessonIndex={lessonIndex}
                      contentIndex={contentIndex}
                      content={content}
                      courseId={courseId}
                      onUpdate={handleUpdateContent}
                    />
                  )}

                  {/* Poll Selector */}
                  {content.type === 'poll' && (
                    <div className="ml-8 mt-4 space-y-4 p-4 bg-white rounded-lg border border-blue-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          เลือกแบบประเมิน *
                        </label>
                        {availablePolls.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              ยังไม่มีแบบประเมินที่สร้างไว้ กรุณาไปที่แท็บ "แบบประเมิน" เพื่อสร้างแบบประเมินก่อน
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => router.push(`/school/courses/${courseId}/polls`)}
                            >
                              ไปที่แท็บแบบประเมิน
                            </Button>
                          </div>
                        ) : (
                          <select
                            value={content.poll?.id || ''}
                            onChange={(e) => handleSelectPoll(lessonIndex, contentIndex, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                          >
                            <option value="">-- เลือกแบบประเมิน --</option>
                            {availablePolls.map((poll) => (
                              <option key={poll.poll.id} value={poll.poll.id}>
                                {poll.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {content.poll && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">{content.poll.title}</h4>
                          {content.poll.description && (
                            <p className="text-sm text-gray-600 mb-3">{content.poll.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            จำนวนคำถาม: {content.poll.questions.length} คำถาม
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assignment Selector */}
                  {content.type === 'assignment' && (
                    <div className="ml-8 mt-4 space-y-4 p-4 bg-white rounded-lg border border-blue-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          เลือกการบ้าน *
                        </label>
                        {availableAssignments.length === 0 ? (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              ยังไม่มีข้อมูลการบ้านที่สร้างไว้ กรุณาไปที่แท็บ "การบ้าน" เพื่อสร้างการบ้านก่อน
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => router.push(`/school/courses/${courseId}/assignments`)}
                            >
                              ไปที่แท็บการบ้าน
                            </Button>
                          </div>
                        ) : (
                          <select
                            value={content.assignment?.id || ''}
                            onChange={(e) => handleSelectAssignment(lessonIndex, contentIndex, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                          >
                            <option value="">-- เลือกการบ้าน --</option>
                            {availableAssignments.map((assignment) => (
                              <option key={assignment.assignment.id} value={assignment.assignment.id}>
                                {assignment.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {content.assignment && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">{content.assignment.title}</h4>
                          {content.assignment.description && (
                            <p className="text-sm text-gray-600 mb-3">{content.assignment.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {content.assignment.dueDate && (
                              <span>
                                กำหนดส่ง: {new Date(content.assignment.dueDate).toLocaleDateString('th-TH')}
                              </span>
                            )}
                            <span>
                              คะแนนเต็ม: {content.assignment.maxScore} คะแนน
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}

              {/* Add Content Buttons */}
              <div className="flex flex-wrap gap-2 ml-8">
                <button
                  onClick={() => handleAddContent(lessonIndex, 'document')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  📄 เพิ่มเอกสาร
                </button>
                <button
                  onClick={() => handleAddContent(lessonIndex, 'video')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🎥 เพิ่มวิดีโอ
                </button>
                <button
                  onClick={() => handleAddContent(lessonIndex, 'pre_test')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  📝 เพิ่มแบบทดสอบก่อนเรียน
                </button>
                <button
                  onClick={() => handleAddContent(lessonIndex, 'quiz')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  📋 เพิ่มแบบทดสอบ
                </button>
                <button
                  onClick={() => {
                    const updated = [...lessons];
                    const newContent: LessonContent = {
                      id: `${Date.now()}-${Math.random()}`,
                      type: 'poll',
                      title: '',
                      order: updated[lessonIndex].contents.length + 1,
                    };
                    updated[lessonIndex].contents.push(newContent);
                    setLessons(updated);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  📊 เพิ่มแบบประเมิน
                </button>
                <button
                  onClick={() => handleAddContent(lessonIndex, 'assignment')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  📝 เพิ่มการบ้าน
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={handleAddLesson} variant="outline">
          <PlusIcon className="h-5 w-5 mr-2" />
          เพิ่มบทเรียนใหม่
        </Button>
      </div>
    </div>
  );
}




