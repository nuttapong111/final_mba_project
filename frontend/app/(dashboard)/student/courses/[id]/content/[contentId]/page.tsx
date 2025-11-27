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
  ClockIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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
  duration?: number;
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
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getById(courseId);
        if (response.success && response.data) {
          // Ensure all properties are properly serialized
          const courseData = {
            ...response.data,
            id: String(response.data.id || ''),
            title: String(response.data.title || ''),
            description: String(response.data.description || ''),
            instructor: response.data.instructor ? {
              id: String(response.data.instructor.id || ''),
              name: String(response.data.instructor.name || 'อาจารย์'),
              avatar: response.data.instructor.avatar ? String(response.data.instructor.avatar) : undefined,
            } : null,
            school: response.data.school ? {
              id: String(response.data.school.id || ''),
              name: String(response.data.school.name || ''),
            } : null,
          };
          
          setCourse(courseData);
          
          // Transform lessons data
          const transformedLessons: Lesson[] = (response.data.lessons || []).map((lesson: any) => ({
            id: String(lesson.id || ''),
            title: String(lesson.title || ''),
            order: typeof lesson.order === 'number' ? lesson.order : 0,
            contents: (lesson.contents || []).map((content: any) => {
              let fileUrl = content.fileUrl;
              if (fileUrl && fileUrl.startsWith('/uploads/')) {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const baseUrl = apiBaseUrl.replace('/api', '');
                fileUrl = `${baseUrl}${fileUrl}`;
              }
              
              return {
                id: String(content.id || ''),
                title: String(content.title || ''),
                type: content.type ? String(content.type).toLowerCase() : 'document',
                url: content.url ? String(content.url) : undefined,
                fileUrl: fileUrl ? String(fileUrl) : undefined,
                fileName: content.fileName ? String(content.fileName) : undefined,
                order: typeof content.order === 'number' ? content.order : 0,
                poll: content.poll || undefined,
                quizSettings: content.quizSettings || undefined,
                duration: typeof content.duration === 'number' ? content.duration : undefined,
              };
            }),
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
            
            // Auto-expand current lesson
            if (foundLesson) {
              setExpandedLessons(new Set([foundLesson.id]));
            }
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

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
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
      const nextContent = currentLesson.contents[currentIndex + 1];
      router.push(`/student/courses/${courseId}/content/${nextContent.id}`);
    } else {
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
      const prevContent = currentLesson.contents[currentIndex - 1];
      router.push(`/student/courses/${courseId}/content/${prevContent.id}`);
    } else {
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
      <div className="flex items-center justify-center min-h-screen bg-white">
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
  const getFullUrl = (url?: string, fileUrl?: string) => {
    if (url) return url;
    if (fileUrl && fileUrl.startsWith('/uploads/')) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const baseUrl = apiBaseUrl.replace('/api', '');
      return `${baseUrl}${fileUrl}`;
    }
    return fileUrl;
  };

  const contentUrl = getFullUrl(currentContent.url, currentContent.fileUrl);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Main Content Area - Left Side (Full Width) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/student/courses/${courseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600 rotate-180" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentContent.title}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentLesson.title} • {getContentTypeLabel(currentContent.type)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Display - Full Screen */}
        <div className="flex-1 overflow-hidden bg-white">
          {currentContent.type === 'video' && (
            <div className="w-full h-full bg-black">
              {(() => {
                const videoUrl = currentContent.url;
                const fileUrl = currentContent.fileUrl;
                const fullUrl = getFullUrl(videoUrl, fileUrl);
                
                if (!fullUrl) {
                  return (
                    <div className="flex items-center justify-center w-full h-full text-white">
                      <div className="text-center">
                        <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl mb-2">ไม่พบวิดีโอ</p>
                        <p className="text-sm text-gray-400">กรุณาตรวจสอบ URL หรือไฟล์วิดีโอ</p>
                      </div>
                    </div>
                  );
                }
                
                // Check if YouTube or Vimeo
                const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
                
                const youtubeMatch = fullUrl.match(youtubeRegex);
                const vimeoMatch = fullUrl.match(vimeoRegex);

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
                
                // Direct video file
                return (
                  <video
                    src={fullUrl}
                    controls
                    className="w-full h-full"
                    onEnded={handleContentComplete}
                    autoPlay
                  >
                    <source src={fullUrl} type="video/mp4" />
                    <source src={fullUrl} type="video/webm" />
                    <source src={fullUrl} type="video/ogg" />
                    เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                  </video>
                );
              })()}
            </div>
          )}

          {currentContent.type === 'document' && (
            <div className="w-full h-full bg-white flex flex-col">
              {(() => {
                const fullUrl = getFullUrl(currentContent.url, currentContent.fileUrl);
                
                if (!fullUrl) {
                  return (
                    <div className="flex items-center justify-center w-full h-full text-gray-600">
                      <div className="text-center">
                        <DocumentTextIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-xl mb-2">ไม่พบเอกสาร</p>
                        <p className="text-sm text-gray-400">กรุณาตรวจสอบไฟล์เอกสาร</p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{currentContent.title}</h3>
                          {currentContent.fileName && (
                            <p className="text-sm text-gray-500">{currentContent.fileName}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={fullUrl}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <iframe
                        src={fullUrl}
                        className="w-full h-full"
                        title={currentContent.title}
                        onLoad={handleContentComplete}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {(currentContent.type === 'quiz' || currentContent.type === 'pre_test') && (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-8">
              <div className="text-center max-w-lg bg-white rounded-xl shadow-lg p-8">
                <ClipboardDocumentCheckIcon className="h-20 w-20 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">แบบทดสอบ</h3>
                <p className="text-gray-600 mb-8 text-lg">{currentContent.title}</p>
                <Button
                  onClick={() => router.push(`/student/courses/${courseId}/quiz/${currentContent.id}`)}
                  className="w-full py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  เริ่มทำแบบทดสอบ
                </Button>
              </div>
            </div>
          )}

          {currentContent.type === 'poll' && (
            <div className="w-full h-full bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-8">
              <div className="text-center max-w-lg bg-white rounded-xl shadow-lg p-8">
                <ClipboardDocumentCheckIcon className="h-20 w-20 text-purple-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">แบบประเมิน</h3>
                <p className="text-gray-600 mb-8 text-lg">{currentContent.title}</p>
                <Button
                  onClick={() => router.push(`/student/courses/${courseId}/poll/${currentContent.poll?.id || currentContent.id}`)}
                  className="w-full py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  เริ่มทำแบบประเมิน
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-between shadow-sm flex-shrink-0">
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

      {/* Sidebar - Right Side */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-l border-gray-200 overflow-hidden flex flex-col shadow-lg flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-sm truncate">{course?.title || 'หลักสูตร'}</h2>
              <p className="text-blue-100 text-xs mt-1">
                {lessons.length} โมดูล
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-blue-700 p-1 rounded ml-2 flex-shrink-0"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lessons.map((lesson, lessonIndex) => {
            const isExpanded = expandedLessons.has(lesson.id);
            
            return (
              <div key={lesson.id} className="mb-2">
                <button
                  onClick={() => toggleLesson(lesson.id)}
                  className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      โมดูล {lessonIndex + 1}: {lesson.title}
                    </h3>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="space-y-1 p-2">
                    {lesson.contents.map((content) => {
                      const isActive = content.id === currentContent.id;
                      const isCompleted = isContentCompleted(content.id);

                      return (
                        <button
                          key={content.id}
                          onClick={() => handleContentClick(content, lesson)}
                          className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-all text-left ${
                            isActive
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`flex-shrink-0 mt-0.5 ${
                            isActive ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            {getContentIcon(content.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium truncate ${
                                isActive ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {content.title}
                              </p>
                              {isCompleted && !isActive && (
                                <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <p className={`text-xs ${
                                isActive ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {getContentTypeLabel(content.type)}
                              </p>
                              {content.duration && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="text-xs text-gray-500">{content.duration} นาที</p>
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Toggle Button (when closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 z-10"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
