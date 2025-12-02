'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi, webboardApi } from '@/lib/api';
import dynamic from 'next/dynamic';
import YouTubePlayer from '@/components/YouTubePlayer';

const StudentAssignmentsPage = dynamic(
  () => import('./assignments/page'),
  { ssr: false }
);
import {
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface LessonContent {
  id: string;
  type: string;
  title: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  order: number;
  quizSettings?: any;
  poll?: any;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  contents: LessonContent[];
}

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'webboard' | 'assignments'>('lessons');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<LessonContent | null>(null);
  const [completedContents, setCompletedContents] = useState<Set<string>>(new Set());
  const [webboardPosts, setWebboardPosts] = useState<any[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getById(courseId);
        if (response.success && response.data) {
          // Ensure all properties are properly serialized
          const courseData = {
            ...response.data,
            instructor: response.data.instructor ? {
              id: String(response.data.instructor.id || ''),
              name: String(response.data.instructor.name || 'อาจารย์'),
              avatar: response.data.instructor.avatar ? String(response.data.instructor.avatar) : undefined,
            } : null,
            school: response.data.school ? {
              id: String(response.data.school.id || ''),
              name: String(response.data.school.name || ''),
            } : null,
            enrolledStudents: Array.isArray(response.data.enrolledStudents) 
              ? response.data.enrolledStudents.map((s: any) => ({
                  id: String(s.id || ''),
                  name: String(s.name || ''),
                  email: String(s.email || ''),
                  avatar: s.avatar ? String(s.avatar) : undefined,
                  enrolledAt: s.enrolledAt ? String(s.enrolledAt) : new Date().toISOString(),
                  progress: typeof s.progress === 'number' ? s.progress : 0,
                }))
              : [],
            teachers: Array.isArray(response.data.teachers)
              ? response.data.teachers.map((t: any) => ({
                  id: String(t.id || ''),
                  name: String(t.name || ''),
                  email: String(t.email || ''),
                  avatar: t.avatar ? String(t.avatar) : undefined,
                  roles: t.roles || { liveTeaching: false, grading: false, webboard: false },
                  addedAt: t.addedAt ? String(t.addedAt) : new Date().toISOString(),
                }))
              : [],
          };
          
          setCourse(courseData);
          
          const transformedLessons: Lesson[] = (response.data.lessons || []).map((lesson: any) => ({
            id: String(lesson.id || ''),
            title: String(lesson.title || ''),
            description: lesson.description ? String(lesson.description) : undefined,
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
                type: content.type ? String(content.type).toLowerCase() : 'document',
                title: String(content.title || ''),
                url: content.url ? String(content.url) : undefined,
                fileUrl: fileUrl ? String(fileUrl) : undefined,
                fileName: content.fileName ? String(content.fileName) : undefined,
                fileSize: typeof content.fileSize === 'number' ? content.fileSize : undefined,
                duration: typeof content.duration === 'number' ? content.duration : undefined,
                order: typeof content.order === 'number' ? content.order : 0,
                quizSettings: content.quizSettings || undefined,
                poll: content.poll || undefined,
              };
            }),
          }));

          setLessons(transformedLessons);
          
          // Auto-expand first lesson
          if (transformedLessons.length > 0) {
            setExpandedLessons(new Set([transformedLessons[0].id]));
          }
          
          // Select first video if available
          for (const lesson of transformedLessons) {
            const firstVideo = lesson.contents.find(c => c.type === 'video');
            if (firstVideo) {
              setSelectedVideo(firstVideo);
              break;
            }
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
  }, [courseId, router]);

  useEffect(() => {
    if (activeTab === 'webboard') {
      fetchWebboard();
    }
  }, [activeTab, courseId]);

  const fetchWebboard = async () => {
    try {
      const response = await webboardApi.getPosts(courseId);
      if (response.success && response.data) {
        setWebboardPosts(response.data);
      }
    } catch (error) {
      console.error('Error fetching webboard:', error);
    }
  };

  const getProgress = () => {
    let totalContents = 0;
    let completedCount = 0;

    lessons.forEach((lesson: Lesson) => {
      lesson.contents.forEach((content: LessonContent) => {
        totalContents++;
        if (completedContents.has(content.id)) {
          completedCount++;
        }
      });
    });

    return totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;
  };

  const getTotalDuration = () => {
    let totalMinutes = 0;
    lessons.forEach((lesson: Lesson) => {
      lesson.contents.forEach((content: LessonContent) => {
        if (content.duration) {
          totalMinutes += content.duration;
        }
      });
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, total: totalMinutes };
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

  const handleContentClick = (content: LessonContent) => {
    if (content.type === 'video') {
      setSelectedVideo(content);
    } else if (content.type === 'document') {
      router.push(`/student/courses/${courseId}/content/${content.id}`);
    } else if (content.type === 'poll') {
      router.push(`/student/courses/${courseId}/poll/${content.poll?.id || content.id}`);
    } else if (content.type === 'quiz' || content.type === 'pre_test') {
      router.push(`/student/courses/${courseId}/quiz/${content.id}`);
    } else if (content.type === 'live_link') {
      if (content.url) {
        window.open(content.url, '_blank');
      }
    }
  };

  const handleVideoSelect = (content: LessonContent) => {
    setSelectedVideo(content);
    handleContentClick(content);
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

  const handleCreatePost = async () => {
    if (!newQuestion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกคำถาม',
        text: 'โปรดกรอกคำถามก่อนส่ง',
      });
      return;
    }

    try {
      const response = await webboardApi.createPost(courseId, newQuestion.trim());
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ส่งคำถามสำเร็จ!',
          timer: 1500,
          showConfirmButton: false,
        });
        setNewQuestion('');
        setShowNewPost(false);
        fetchWebboard();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถส่งคำถามได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งคำถามได้',
      });
    }
  };

  const handleReply = async (postId: string) => {
    const content = replyContent[postId]?.trim();
    if (!content) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกคำตอบ',
        text: 'โปรดกรอกคำตอบก่อนส่ง',
      });
      return;
    }

    try {
      const response = await webboardApi.replyToPost(postId, content);
      if (response.success) {
        await Swal.fire({
          icon: 'success',
          title: 'ส่งคำตอบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false,
        });
        setReplyContent({ ...replyContent, [postId]: '' });
        setReplyingTo(null);
        fetchWebboard();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: response.error || 'ไม่สามารถส่งคำตอบได้',
        });
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งคำตอบได้',
      });
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

  if (!course) {
    return null;
  }

  const progress = getProgress();
  const duration = getTotalDuration();
  const isCompleted = progress >= 100;

  // Get video URL for selected video
  const getVideoUrl = () => {
    if (!selectedVideo) return null;
    
    let videoUrl = selectedVideo.url;
    let fileUrl = selectedVideo.fileUrl;
    
    if (fileUrl && fileUrl.startsWith('/uploads/')) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const baseUrl = apiBaseUrl.replace('/api', '');
      fileUrl = `${baseUrl}${fileUrl}`;
    }
    
    return videoUrl || fileUrl;
  };

  const videoUrl = getVideoUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
            <button
              onClick={() => router.push('/student/courses')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{course?.instructor?.name || 'อาจารย์'}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{typeof course?.students === 'number' ? course.students : (course?.enrolledStudents?.length || 0)} ผู้เรียน</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">ความคืบหน้า</span>
                <span className="font-bold text-gray-900">{progress}%</span>
              </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

          {/* Continue Learning Button */}
          {!isCompleted && (
            <div className="mt-4">
              <Button
                onClick={() => {
                  // Find first uncompleted content
                  for (const lesson of lessons) {
                    for (const content of lesson.contents) {
                      if (!completedContents.has(content.id)) {
                        handleContentClick(content);
                        return;
                      }
                    }
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <PlayIcon className="h-5 w-5 mr-2 inline" />
                เรียนต่อ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-3 sm:px-6">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex-shrink-0 ${
                activeTab === 'lessons'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              รายละเอียดบทเรียน
              {activeTab === 'lessons' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex-shrink-0 ${
                activeTab === 'assignments'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              การบ้าน
              {activeTab === 'assignments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('webboard')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors relative whitespace-nowrap flex-shrink-0 ${
                activeTab === 'webboard'
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              กระดานสนทนา
              {activeTab === 'webboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'assignments' ? (
          <StudentAssignmentsPage />
        ) : activeTab === 'lessons' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Side - Lessons List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-lg border-0">
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    บทเรียนและหลักสูตรของคุณ
            </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                    {lessons.length} บทเรียน - ความยาวทั้งหมด {duration.hours} ชั่วโมง {duration.minutes} นาที
                  </p>

                  <div className="space-y-2">
                    {lessons.map((lesson) => {
                      const isExpanded = expandedLessons.has(lesson.id);
                      const lessonContents = lesson.contents.length;
                      const lessonDuration = lesson.contents.reduce((sum, c) => sum + (c.duration || 0), 0);

                return (
                  <div
                          key={lesson.id}
                          className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => toggleLesson(lesson.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1 text-left">
                              {isExpanded ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {lessonContents} บทเรียน • {lessonDuration} นาที
                                </p>
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              {lesson.contents.map((content, index) => {
                                const isCompleted = completedContents.has(content.id);
                                const isSelected = selectedVideo?.id === content.id;

                                return (
                                  <button
                    key={content.id}
                                    onClick={() => handleVideoSelect(content)}
                                    className={`w-full flex items-center space-x-3 p-4 text-left transition-colors ${
                                      isSelected
                                        ? 'bg-purple-50 border-l-4 border-purple-600'
                                        : 'hover:bg-white'
                                    }`}
                                  >
                                    <div className={`flex-shrink-0 ${
                                      isSelected ? 'text-purple-600' : 'text-gray-400'
                                    }`}>
                                      {getContentIcon(content.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-medium truncate ${
                                          isSelected ? 'text-purple-900' : 'text-gray-900'
                                        }`}>
                                          {content.title}
                                        </p>
                                        {isCompleted && (
                                          <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <p className="text-xs text-gray-500">
                                          {getContentTypeLabel(content.type)}
                                        </p>
                                        {content.duration && (
                                          <>
                                            <span className="text-xs text-gray-400">•</span>
                                            <p className="text-xs text-gray-500">
                                              {content.duration} นาที
                                            </p>
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
              </Card>
            </div>

            {/* Right Side - Video Player */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 sticky top-4 sm:top-6">
                <div className="p-4 sm:p-6">
                  {selectedVideo ? (
                    <>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {selectedVideo.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {getContentTypeLabel(selectedVideo.type)}
                        </p>
                      </div>

                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                        {videoUrl ? (
                          (() => {
                            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                            const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
                            
                            const youtubeMatch = videoUrl.match(youtubeRegex);
                            const vimeoMatch = videoUrl.match(vimeoRegex);

                            if (youtubeMatch) {
                              const videoId = youtubeMatch[1];
                              return (
                                <YouTubePlayer
                                  videoId={videoId}
                                  title={selectedVideo.title}
                                  contentId={selectedVideo.id}
                                  courseId={courseId}
                                  className="w-full h-full"
                                />
                              );
                            } else if (vimeoMatch) {
                              const videoId = vimeoMatch[1];
                              return (
                                <iframe
                                  src={`https://player.vimeo.com/video/${videoId}`}
                                  className="w-full h-full"
                                  allowFullScreen
                                  title={selectedVideo.title}
                                />
                              );
                            } else {
                              return (
                                <video
                                  src={videoUrl}
                                  controls
                                  className="w-full h-full"
                                  onEnded={() => {
                                    if (selectedVideo) {
                                      setCompletedContents(new Set([...completedContents, selectedVideo.id]));
                                    }
                                  }}
                                >
                                  <source src={videoUrl} type="video/mp4" />
                                  <source src={videoUrl} type="video/webm" />
                                  <source src={videoUrl} type="video/ogg" />
                                  เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                                </video>
                              );
                            }
                          })()
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-white">
                            <div className="text-center">
                              <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">ไม่พบวิดีโอ</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => router.push(`/student/courses/${courseId}/content/${selectedVideo.id}`)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                      >
                        <PlayIcon className="h-5 w-5 mr-2 inline" />
                        เริ่มเรียน
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">เลือกบทเรียนเพื่อเริ่มเรียน</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Webboard Tab */
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowNewPost(!showNewPost)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 inline" />
                ตั้งคำถามใหม่
              </Button>
            </div>

            {showNewPost && (
              <Card className="shadow-lg border-0">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">ตั้งคำถามใหม่</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คำถาม *
                      </label>
                      <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        placeholder="กรอกคำถามของคุณ..."
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewPost(false);
                          setNewQuestion('');
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={handleCreatePost}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        ส่งคำถาม
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {webboardPosts.length === 0 ? (
              <Card className="shadow-lg border-0">
                <div className="text-center py-12">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">ยังไม่มีคำถามในกระดานสนทนา</p>
                  <p className="text-sm text-gray-500 mt-2">เป็นคนแรกที่ตั้งคำถาม!</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {webboardPosts.map((post) => (
                  <Card key={post.id} className="shadow-lg border-0">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {post.student?.avatar ? (
                            <img
                              src={post.student.avatar}
                              alt={post.student.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900">{post.student?.name || 'นักเรียน'}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleString('th-TH')}
                              </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{post.question}</p>
                        </div>
                      </div>

                      {post.replies && post.replies.length > 0 && (
                        <div className="ml-13 border-l-2 border-gray-200 pl-4 space-y-3">
                          {post.replies.map((reply: any) => (
                            <div key={reply.id} className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {reply.author?.avatar ? (
                                  <img
                                    src={reply.author.avatar}
                                    alt={reply.author.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    reply.author?.role === 'TEACHER' ? 'bg-purple-100' : 'bg-gray-100'
                                  }`}>
                                    {reply.author?.role === 'TEACHER' ? (
                                      <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                                    ) : (
                                      <UserIcon className="h-5 w-5 text-gray-600" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {reply.author?.name || 'ผู้ใช้'}
                                  </span>
                                  {reply.author?.role === 'TEACHER' && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                      อาจารย์
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {new Date(reply.createdAt).toLocaleString('th-TH')}
                                  </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingTo === post.id ? (
                        <div className="ml-13 space-y-2">
                          <textarea
                            value={replyContent[post.id] || ''}
                            onChange={(e) => setReplyContent({ ...replyContent, [post.id]: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            placeholder="กรอกคำตอบ..."
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent({ ...replyContent, [post.id]: '' });
                              }}
                            >
                              ยกเลิก
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReply(post.id)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            >
                              ส่งคำตอบ
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-13">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyingTo(post.id)}
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1 inline" />
                            ตอบกลับ
                          </Button>
                        </div>
                        )}
            </div>
          </Card>
        ))}
      </div>
            )}
          </div>
      )}
      </div>
    </div>
  );
}
