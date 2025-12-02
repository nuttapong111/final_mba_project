'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, contentProgressApi } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import YouTubePlayer from '@/components/YouTubePlayer';
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
  DocumentArrowUpIcon,
  PaperClipIcon,
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
  fileSize?: number;
  order: number;
  poll?: any;
  quizSettings?: any;
  assignment?: any;
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
  const [contentProgressMap, setContentProgressMap] = useState<Map<string, boolean>>(new Map()); // Map of contentId -> completed
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [contentUrl, setContentUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const documentMarkedRef = useRef<Set<string>>(new Set()); // Track which documents have been marked as completed

  // Convert fileUrl to full URL if needed
  // Supports both S3 URLs and local storage URLs
  const getFullUrl = useCallback(async (url?: string, fileUrl?: string, contentId?: string) => {
    if (url) {
      // If url is already a full URL, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
    }
    
    if (fileUrl) {
      // If already a full URL (S3 or external), return as is
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        return fileUrl;
      }
      
      // Check if it's an S3 proxy URL (backend endpoint for S3 files)
      if (fileUrl.startsWith('/api/files/s3/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return `${baseUrl}${fileUrl}`;
      }
      
      // If relative path starting with /uploads/ (might be in S3)
      if (fileUrl.startsWith('/uploads/')) {
        // Try to find file in S3 using contentId
        if (contentId && typeof window !== 'undefined') {
          try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('token');
            if (token) {
              const response = await fetch(`${apiBaseUrl}/files/find-by-content/${contentId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.url) {
                  console.log(`[FILES] Found file in S3 via contentId: ${data.url}`);
                  return data.url;
                }
              }
            }
          } catch (error) {
            console.error('[FILES] Error finding file in S3:', error);
          }
        }
        
        // Fallback to local storage URL
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return `${baseUrl}${fileUrl}`;
      }
      
      // If just filename, assume it's in uploads (local storage)
      if (!fileUrl.startsWith('/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return `${baseUrl}/uploads/${fileUrl}`;
      }
    }
    
    return url || fileUrl;
  }, []);

  // Fetch content progress for all contents in the course
  useEffect(() => {
    const fetchContentProgress = async () => {
      try {
        const response = await contentProgressApi.getCourseProgress(courseId);
        if (response.success && response.data) {
          const progressMap = new Map<string, boolean>();
          
          // Extract completed status from course data
          if (response.data.lessons) {
            response.data.lessons.forEach((lesson: any) => {
              if (lesson.contents) {
                lesson.contents.forEach((content: any) => {
                  if (content.contentProgress && content.contentProgress.length > 0) {
                    const progress = content.contentProgress[0];
                    progressMap.set(content.id, progress.completed || false);
                  }
                });
              }
            });
          }
          
          setContentProgressMap(progressMap);
          
          // Also update completedContents set for backward compatibility
          const completedSet = new Set<string>();
          progressMap.forEach((completed, contentId) => {
            if (completed) {
              completedSet.add(contentId);
            }
          });
          setCompletedContents(completedSet);
        }
      } catch (error) {
        console.error('Error fetching content progress:', error);
      }
    };

    if (courseId) {
      fetchContentProgress();
    }
  }, [courseId]);

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
              // Keep fileUrl as-is (don't convert to full URL here)
              // getFullUrl will handle S3 lookup and URL conversion
              const fileUrl = content.fileUrl ? String(content.fileUrl) : undefined;
              
              return {
                id: String(content.id || ''),
                title: String(content.title || ''),
                type: content.type ? String(content.type).toLowerCase() : 'document',
                url: content.url ? String(content.url) : undefined,
                fileUrl: fileUrl,
                fileName: content.fileName ? String(content.fileName) : undefined,
                fileSize: typeof content.fileSize === 'number' ? content.fileSize : undefined,
                order: typeof content.order === 'number' ? content.order : 0,
                poll: content.poll || undefined,
                quizSettings: content.quizSettings || undefined,
                assignment: content.assignment || undefined,
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
      case 'assignment':
        return <DocumentArrowUpIcon className="h-5 w-5" />;
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
      case 'assignment':
        return 'การบ้าน';
      default:
        return 'เนื้อหา';
    }
  };

  const isContentCompleted = (contentId: string) => {
    // Check both state and progress map
    return completedContents.has(contentId) || contentProgressMap.get(contentId) === true;
  };

  // Helper function to refresh progress from API
  const refreshProgress = async () => {
    try {
      const response = await contentProgressApi.getCourseProgress(courseId);
      if (response.success && response.data) {
        const updatedProgressMap = new Map<string, boolean>();
        if (response.data.lessons) {
          response.data.lessons.forEach((lesson: any) => {
            if (lesson.contents) {
              lesson.contents.forEach((content: any) => {
                if (content.contentProgress && content.contentProgress.length > 0) {
                  const progress = content.contentProgress[0];
                  updatedProgressMap.set(content.id, progress.completed || false);
                }
              });
            }
          });
        }
        setContentProgressMap(updatedProgressMap);
        
        const updatedCompletedSet = new Set<string>();
        updatedProgressMap.forEach((completed, contentId) => {
          if (completed) {
            updatedCompletedSet.add(contentId);
          }
        });
        setCompletedContents(updatedCompletedSet);
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  };

  const handleContentComplete = async () => {
    if (currentContent) {
      const newCompletedSet = new Set([...completedContents, currentContent.id]);
      setCompletedContents(newCompletedSet);
      
      // Update progress map
      const newProgressMap = new Map(contentProgressMap);
      newProgressMap.set(currentContent.id, true);
      setContentProgressMap(newProgressMap);
      
      // Mark document as completed when viewed (only once per document)
      if (currentContent.type === 'document' && !documentMarkedRef.current.has(currentContent.id)) {
        try {
          await contentProgressApi.markContentCompleted(currentContent.id, courseId);
          documentMarkedRef.current.add(currentContent.id);
          console.log(`[ContentProgress] Marked document ${currentContent.id} as completed`);
          
          // Refresh progress to get updated data
          await refreshProgress();
        } catch (error) {
          console.error('Error marking document as completed:', error);
        }
      }
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

  useEffect(() => {
    const loadContentUrl = async () => {
      if (currentContent) {
        if (currentContent.type === 'video') {
          const url = await getFullUrl(currentContent.url, currentContent.fileUrl, currentContent.id);
          setVideoUrl(url);
        } else {
          const url = await getFullUrl(currentContent.url, currentContent.fileUrl, currentContent.id);
          setContentUrl(url);
        }
      } else {
        // Reset URLs when content changes
        setContentUrl(null);
        setVideoUrl(null);
      }
    };
    loadContentUrl();
  }, [currentContent, getFullUrl]);

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

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white overflow-hidden w-full">
      {/* Main Content Area - Left Side (Full Width) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.push(`/student/courses/${courseId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600 rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{currentContent.title}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {currentLesson.title} • {getContentTypeLabel(currentContent.type)}
                </p>
              </div>
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronRightIcon className={`h-5 w-5 text-gray-600 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Display - Full Screen */}
        <div className="flex-1 overflow-hidden bg-white">
          {currentContent.type === 'video' && (
            <div className="w-full h-full bg-black">
              {(() => {
                const fullUrl = videoUrl;
                
                if (!fullUrl) {
                  return (
                    <div className="flex items-center justify-center w-full h-full text-white">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-xl mb-2">กำลังโหลดวิดีโอ...</p>
                        <p className="text-sm text-gray-400">กรุณารอสักครู่</p>
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
                    <YouTubePlayer
                      videoId={videoId}
                      title={currentContent.title}
                      contentId={currentContent.id}
                      courseId={courseId}
                      onComplete={async () => {
                        await handleContentComplete();
                        // Refresh progress after video completion
                        await refreshProgress();
                      }}
                      className="w-full h-full"
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
                
                // Direct video file - use VideoPlayer component for progress tracking
                return (
                  <VideoPlayer
                    src={fullUrl}
                    title={currentContent.title}
                    contentId={currentContent.id}
                    courseId={courseId}
                    onComplete={async () => {
                      await handleContentComplete();
                      // Refresh progress after video completion
                      await refreshProgress();
                    }}
                    className="w-full h-full"
                  />
                );
              })()}
            </div>
          )}

          {currentContent.type === 'document' && (
            <div className="w-full h-full bg-white flex flex-col">
              {(() => {
                const fullUrl = contentUrl;
                
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0 gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{currentContent.title}</h3>
                          {currentContent.fileName && (
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{currentContent.fileName}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={fullUrl}
                        download
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md text-sm whitespace-nowrap w-full sm:w-auto justify-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <iframe
                        src={fullUrl}
                        className="w-full h-full"
                        title={currentContent.title}
                        onLoad={handleContentComplete}
                        onError={(e) => {
                          console.error('Error loading document:', e);
                        }}
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

          {currentContent.type === 'assignment' && (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-8">
              <div className="text-center max-w-2xl bg-white rounded-xl shadow-lg p-8">
                <DocumentArrowUpIcon className="h-20 w-20 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">การบ้าน</h3>
                <p className="text-gray-600 mb-6 text-lg">{currentContent.title}</p>
                
                {/* Assignment File Download */}
                {currentContent.fileName && contentUrl && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <PaperClipIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-900 mb-2">ไฟล์การบ้าน</p>
                        <a
                          href={contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 underline text-sm font-medium break-words mb-1"
                          download={currentContent.fileName}
                        >
                          <DocumentArrowUpIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span className="break-words">{currentContent.fileName}</span>
                        </a>
                        {currentContent.fileSize && (
                          <p className="text-xs text-gray-500 mt-1">
                            ขนาด: {currentContent.fileSize < 1024 
                              ? `${currentContent.fileSize} B` 
                              : currentContent.fileSize < 1024 * 1024
                              ? `${(currentContent.fileSize / 1024).toFixed(2)} KB`
                              : `${(currentContent.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(`/student/courses/${courseId}/assignments`)}
                    className="w-full py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2 inline" />
                    ไปที่หน้าส่งการบ้าน
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/student/courses/${courseId}`)}
                    className="w-full py-2 text-sm"
                  >
                    กลับไปหน้าหลักสูตร
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white border-t border-gray-200 flex justify-between gap-2 shadow-sm flex-shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevContent}
            disabled={!currentLesson || currentLesson.contents.findIndex((c) => c.id === currentContent.id) === 0 && lessons.findIndex((l) => l.id === currentLesson.id) === 0}
            className="text-xs sm:text-sm px-3 sm:px-4"
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
            className="text-xs sm:text-sm px-3 sm:px-4"
          >
            เนื้อหาถัดไป →
          </Button>
        </div>
      </div>

      {/* Sidebar - Right Side */}
      <div
        className={`${
          sidebarOpen ? 'w-full lg:w-80' : 'w-0'
        } transition-all duration-300 bg-white border-l border-gray-200 overflow-hidden flex flex-col shadow-lg flex-shrink-0 fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto`}
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
                              {isCompleted && (
                                <CheckCircleIcon className={`h-4 w-4 flex-shrink-0 ml-2 ${
                                  isActive ? 'text-green-600' : 'text-green-600'
                                }`} />
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

      {/* Sidebar Toggle Button (when closed) - Desktop only */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden lg:block fixed right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 z-10"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
      
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
