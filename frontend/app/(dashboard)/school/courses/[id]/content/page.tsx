'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PlusIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { mockQuestionCategories, type Lesson, type LessonContent, type Poll, type QuestionCategory, type ExamQuestionSelection, type QuizSettings } from '@/lib/mockData';
import { coursesApi, pollsApi, uploadApi } from '@/lib/api';

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
  const categories = mockQuestionCategories.filter(cat => cat.courseId === courseId || !cat.courseId);
  const quizSettings = content.quizSettings || {
    totalQuestions: 0,
    categorySelections: [],
    duration: 60,
    maxAttempts: 0,
    timeRestriction: 'always' as const,
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
                        จำนวนข้อ
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={category?.questionCount || 0}
                        value={selection.questionCount || ''}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 0;
                          const maxCount = category?.questionCount || 0;
                          handleUpdateCategorySelection(index, 'questionCount', Math.min(count, maxCount));
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="0"
                      />
                      {category && (
                        <p className="text-xs text-gray-500 mt-1">
                          สูงสุด {category.questionCount} ข้อ
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
          contents: (lesson.contents || []).map((content: any) => ({
            id: content.id,
            type: content.type.toLowerCase(),
            title: content.title,
            url: content.url,
            fileUrl: content.fileUrl,
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
              categorySelections: (content.quizSettings.categorySelections || []).map((sel: any) => ({
                categoryId: sel.categoryId,
                categoryName: sel.categoryName,
                questionCount: sel.questionCount,
                difficulty: sel.difficulty?.toLowerCase(),
              })),
            } : undefined,
            poll: content.poll,
          })),
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
      title: type === 'pre_test' ? 'แบบทดสอบก่อนเรียน' : type === 'quiz' ? 'แบบทดสอบ' : '',
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

  const handleSave = async () => {
    try {
      // อัพโหลดไฟล์ใหม่ก่อน
      const uploadPromises: Array<Promise<void>> = [];
      
      lessons.forEach((lesson, lessonIndex) => {
        lesson.contents.forEach((content, contentIndex) => {
          // ถ้ามีไฟล์ใหม่ (file object) และยังไม่มี URL
          if ((content as any).file && !content.url?.trim()) {
            const file = (content as any).file as File;
            const fileType = content.type === 'video' ? 'video' : 'document';
            
            uploadPromises.push(
              uploadApi.uploadFile(file, fileType)
                .then((response) => {
                  if (response.success && response.data) {
                    // อัพเดต fileUrl, fileName, fileSize จาก response
                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', response.data.url);
                    handleUpdateContent(lessonIndex, contentIndex, 'fileName', response.data.fileName);
                    handleUpdateContent(lessonIndex, contentIndex, 'fileSize', response.data.fileSize);
                    // ลบ file object ออก
                    handleUpdateContent(lessonIndex, contentIndex, 'file', undefined);
                  } else {
                    throw new Error(response.error || 'ไม่สามารถอัพโหลดไฟล์ได้');
                  }
                })
                .catch((error) => {
                  throw new Error(`ไม่สามารถอัพโหลดไฟล์ "${content.title}": ${error.message}`);
                })
            );
          }
        });
      });

      // รอให้อัพโหลดไฟล์เสร็จก่อน
      if (uploadPromises.length > 0) {
        await Swal.fire({
          title: 'กำลังอัพโหลดไฟล์...',
          text: `กำลังอัพโหลด ${uploadPromises.length} ไฟล์ กรุณารอสักครู่`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Promise.all(uploadPromises);
      }

      // Prepare lessons data for API
      const lessonsData = lessons.map((lesson, index) => ({
        title: lesson.title,
        description: lesson.description || '',
        order: index + 1,
        contents: lesson.contents.map((content, contentIndex) => {
          const contentData: any = {
            type: content.type,
            title: content.title,
            order: contentIndex + 1,
          };

          // ถ้ามี URL ให้ใช้ URL (สำหรับ YouTube/Vimeo หรือไฟล์ที่อัพโหลดแล้ว)
          if (content.url && content.url.trim()) {
            contentData.url = content.url;
          }
          
          // ถ้า fileUrl เป็น URL จาก backend (http/https หรือ /uploads/) ให้ใช้
          if (content.fileUrl && (content.fileUrl.startsWith('http') || content.fileUrl.startsWith('/uploads/'))) {
            contentData.fileUrl = content.fileUrl;
            if (content.fileName) contentData.fileName = content.fileName;
            if (content.fileSize) contentData.fileSize = content.fileSize;
          }
          
          if (content.duration) contentData.duration = content.duration;
          if (content.poll?.id) contentData.pollId = content.poll.id;

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
        <Button onClick={handleSave}>
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>

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
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`video-source-${lessonIndex}-${contentIndex}`}
                                  checked={!content.fileUrl}
                                  onChange={() => {
                                    handleUpdateContent(lessonIndex, contentIndex, 'fileUrl', undefined);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">ใช้ URL</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`video-source-${lessonIndex}-${contentIndex}`}
                                  checked={!!content.fileUrl}
                                  onChange={() => {
                                    handleUpdateContent(lessonIndex, contentIndex, 'url', undefined);
                                  }}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">อัพโหลดไฟล์</span>
                              </label>
                            </div>
                          </div>
                          {!content.fileUrl ? (
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
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              />
                              {content.fileUrl && (
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
                          <Input
                            label="ระยะเวลา (นาที)"
                            type="number"
                            value={content.duration || ''}
                            onChange={(e) => handleUpdateContent(lessonIndex, contentIndex, 'duration', parseInt(e.target.value))}
                            placeholder="45"
                          />
                        </>
                      )}
                      {content.type === 'document' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            ไฟล์เอกสาร
                          </label>
                          <input
                            type="file"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            accept=".pdf,.doc,.docx"
                          />
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
                  📋 เพิ่มข้อสอบ
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




