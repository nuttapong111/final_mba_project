'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import {
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Lesson {
  id: string;
  title: string;
  order: number;
  contents: LessonContent[];
}

interface LessonContent {
  id: string;
  title: string;
  type: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  order: number;
  poll?: any;
  quizSettings?: any;
}

export default function StudentContentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;
  const contentId = params.contentId as string;
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentContent, setCurrentContent] = useState<LessonContent | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedContents, setCompletedContents] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getById(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
          
          // Transform lessons data
          const transformedLessons: Lesson[] = (response.data.lessons || []).map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            contents: (lesson.contents || []).map((content: any) => ({
              id: content.id,
              title: content.title,
              type: content.type,
              url: content.url,
              fileUrl: content.fileUrl,
              fileName: content.fileName,
              order: content.order,
              poll: content.poll,
              quizSettings: content.quizSettings,
            })),
          }));

          setLessons(transformedLessons);

          // Find current content
          let foundContent: LessonContent | null = null;
          let foundLesson: Lesson | null = null;

          for (const lesson of transformedLessons) {
            const content = lesson.contents.find((c) => c.id === contentId);
            if (content) {
              foundContent = content;
              foundLesson = lesson;
              break;
            }
          }

          if (foundContent) {
            setCurrentContent(foundContent);
            setCurrentLesson(foundLesson);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'ไม่พบเนื้อหา',
              text: 'ไม่พบเนื้อหาที่ต้องการ',
            });
            router.push(`/student/courses/${courseId}`);
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: response.error || 'ไม่พบหลักสูตร',
          });
          router.push('/student/courses');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลหลักสูตรได้',
        });
        router.push('/student/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, contentId, router]);

  const handleContentClick = (content: LessonContent, lesson: Lesson) => {
    router.push(`/student/courses/${courseId}/content/${content.id}`);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="h-5 w-5" />;
      case 'document':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'quiz':
      case 'pre_test':
        return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
      case 'poll':
        return <ClipboardDocumentCheckIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'วีดิทัศน์';
      case 'document':
        return 'การอ่าน';
      case 'quiz':
        return 'แบบทดสอบ';
      case 'pre_test':
        return 'แบบทดสอบก่อนเรียน';
      case 'poll':
        return 'แบบประเมิน';
      default:
        return 'เนื้อหา';
    }
  };

  const isContentCompleted = (contentId: string) => {
    return completedContents.has(contentId);
  };

  const handleContentComplete = () => {
    if (currentContent) {
      setCompletedContents(new Set([...completedContents, currentContent.id]));
    }
  };

  const handleNextContent = () => {
    if (!currentLesson || !currentContent) return;

    const currentIndex = currentLesson.contents.findIndex((c) => c.id === currentContent.id);
    if (currentIndex < currentLesson.contents.length - 1) {
      // Next content in same lesson
      const nextContent = currentLesson.contents[currentIndex + 1];
      router.push(`/student/courses/${courseId}/content/${nextContent.id}`);
    } else {
      // Find next lesson
      const currentLessonIndex = lessons.findIndex((l) => l.id === currentLesson.id);
      if (currentLessonIndex < lessons.length - 1) {
        const nextLesson = lessons[currentLessonIndex + 1];
        if (nextLesson.contents.length > 0) {
          router.push(`/student/courses/${courseId}/content/${nextLesson.contents[0].id}`);
        }
      }
    }
  };

  const handlePrevContent = () => {
    if (!currentLesson || !currentContent) return;

    const currentIndex = currentLesson.contents.findIndex((c) => c.id === currentContent.id);
    if (currentIndex > 0) {
      // Previous content in same lesson
      const prevContent = currentLesson.contents[currentIndex - 1];
      router.push(`/student/courses/${courseId}/content/${prevContent.id}`);
    } else {
      // Find previous lesson
      const currentLessonIndex = lessons.findIndex((l) => l.id === currentLesson.id);
      if (currentLessonIndex > 0) {
        const prevLesson = lessons[currentLessonIndex - 1];
        if (prevLesson.contents.length > 0) {
          const lastContent = prevLesson.contents[prevLesson.contents.length - 1];
          router.push(`/student/courses/${courseId}/content/${lastContent.id}`);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!currentContent || !currentLesson) {
    return null;
  }

  // Convert fileUrl to full URL if needed
  let contentUrl = currentContent.url || currentContent.fileUrl;
  if (currentContent.fileUrl && currentContent.fileUrl.startsWith('/uploads/')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    contentUrl = `${baseUrl}${currentContent.fileUrl}`;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{course?.title || 'หลักสูตร'}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {lessons.length} โมดูล
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-blue-800 p-1 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lessons.map((lesson, lessonIndex) => (
            <div key={lesson.id} className="mb-2">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 text-sm">
                  โมดูล {lessonIndex + 1}: {lesson.title}
                </h3>
              </div>
              <div className="space-y-1 p-2">
                {lesson.contents.map((content) => {
                  const isActive = content.id === currentContent.id;
                  const isCompleted = isContentCompleted(content.id);

                  return (
                    <button
                      key={content.id}
                      onClick={() => handleContentClick(content, lesson)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {getContentIcon(content.type)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            isActive ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {content.title}
                          </p>
                          {isCompleted && (
                            <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {getContentTypeLabel(content.type)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Toggle Button (when closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-blue-700 z-10"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentContent.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentLesson.title} • {getContentTypeLabel(currentContent.type)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/student/courses/${courseId}`)}
              >
                กลับไปหน้าหลักสูตร
              </Button>
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Card className="max-w-6xl mx-auto shadow-lg">
            {currentContent.type === 'video' && (
              <div className="bg-black rounded-lg overflow-hidden">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute inset-0">
                    {(() => {
                      const videoUrl = currentContent.url || contentUrl;
                      const fileUrl = currentContent.fileUrl;
                      
                      // Check if YouTube or Vimeo
                      if (videoUrl) {
                        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                        const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
                        
                        const youtubeMatch = videoUrl.match(youtubeRegex);
                        const vimeoMatch = videoUrl.match(vimeoRegex);

                        if (youtubeMatch) {
                          const videoId = youtubeMatch[1];
                          return (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={currentContent.title}
                              onLoad={handleContentComplete}
                            />
                          );
                        } else if (vimeoMatch) {
                          const videoId = vimeoMatch[1];
                          return (
                            <iframe
                              src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
                              className="w-full h-full"
                              allowFullScreen
                              title={currentContent.title}
                              onLoad={handleContentComplete}
                            />
                          );
                        }
                      }
                      
                      // Direct video file
                      if (fileUrl || videoUrl) {
                        return (
                          <video
                            src={fileUrl || videoUrl}
                            controls
                            className="w-full h-full"
                            onEnded={handleContentComplete}
                            autoPlay
                          >
                            <source src={fileUrl || videoUrl} type="video/mp4" />
                            <source src={fileUrl || videoUrl} type="video/webm" />
                            <source src={fileUrl || videoUrl} type="video/ogg" />
                            เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                          </video>
                        );
                      }
                      
                      return (
                        <div className="flex items-center justify-center w-full h-full text-white">
                          <p>ไม่พบวิดีโอ</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {currentContent.type === 'document' && (
              <div className="bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
                {contentUrl ? (
                  <iframe
                    src={contentUrl}
                    className="w-full h-full"
                    title={currentContent.title}
                    onLoad={handleContentComplete}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-600">
                    <p>ไม่พบเอกสาร</p>
                  </div>
                )}
              </div>
            )}

            {(currentContent.type === 'quiz' || currentContent.type === 'pre_test') && (
              <div className="text-center py-12">
                <ClipboardDocumentCheckIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">แบบทดสอบ</h3>
                <p className="text-gray-600 mb-6">{currentContent.title}</p>
                <Button
                  onClick={() => router.push(`/student/courses/${courseId}/quiz/${currentContent.id}`)}
                >
                  เริ่มทำแบบทดสอบ
                </Button>
              </div>
            )}

            {currentContent.type === 'poll' && (
              <div className="text-center py-12">
                <ClipboardDocumentCheckIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">แบบประเมิน</h3>
                <p className="text-gray-600 mb-6">{currentContent.title}</p>
                <Button
                  onClick={() => router.push(`/student/courses/${courseId}/poll/${currentContent.poll?.id || currentContent.id}`)}
                >
                  เริ่มทำแบบประเมิน
                </Button>
              </div>
            )}
          </Card>

          {/* Navigation Buttons */}
          <div className="max-w-6xl mx-auto mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevContent}
              disabled={!currentLesson || currentLesson.contents.findIndex((c) => c.id === currentContent.id) === 0 && lessons.findIndex((l) => l.id === currentLesson.id) === 0}
            >
              ← เนื้อหาก่อนหน้า
            </Button>
            <Button
              variant="outline"
              onClick={handleNextContent}
              disabled={
                !currentLesson ||
                (currentLesson.contents.findIndex((c) => c.id === currentContent.id) === currentLesson.contents.length - 1 &&
                 lessons.findIndex((l) => l.id === currentLesson.id) === lessons.length - 1)
              }
            >
              เนื้อหาถัดไป →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

