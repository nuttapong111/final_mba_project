'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { coursesApi } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import {
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function StudentCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedContents, setCompletedContents] = useState<Set<string>>(new Set());
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [videoPlayer, setVideoPlayer] = useState<{
    isOpen: boolean;
    title: string;
    videoUrl?: string;
    fileUrl?: string;
  }>({
    isOpen: false,
    title: '',
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await coursesApi.getById(courseId);
        if (response.success && response.data) {
          setCourse(response.data);
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

  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-600">ไม่พบหลักสูตร</p>
          <Button onClick={() => router.push('/student/courses')} className="mt-4">
            กลับไปหน้าหลักสูตร
          </Button>
        </div>
      </Card>
    );
  }

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

  const lessons: Lesson[] = (course.lessons || []).map((lesson: any) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    contents: (lesson.contents || []).map((content: any) => {
      // แปลง fileUrl ให้เป็น full URL ถ้าเป็น relative path
      let fileUrl = content.fileUrl;
      if (fileUrl && fileUrl.startsWith('/uploads/')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
        quizSettings: content.quizSettings,
        poll: content.poll,
      };
    }),
  }));

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

  const progress = getProgress();
  const isCompleted = progress >= 100;

  const handleContentClick = (content: LessonContent) => {
    if (content.type === 'video') {
      // เปิด video player modal
      setVideoPlayer({
        isOpen: true,
        title: content.title,
        videoUrl: content.url,
        fileUrl: content.fileUrl,
      });
    } else if (content.type === 'document') {
      Swal.fire({
        title: 'เปิดเอกสาร',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${content.title}</strong></p>
            <p class="text-sm text-gray-600">กำลังเปิดเอกสาร...</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        setCompletedContents(new Set([...completedContents, content.id]));
      });
    } else if (content.type === 'quiz' || content.type === 'pre_test') {
      router.push(`/student/courses/${courseId}/quiz/${content.id}`);
    } else if (content.type === 'live_link') {
      Swal.fire({
        title: 'เข้าห้องเรียนออนไลน์',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>${content.title}</strong></p>
            <p class="text-sm text-gray-600">กำลังเปิดลิงก์ห้องเรียนออนไลน์...</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'ตกลง',
      });
    }
  };

  const isContentUnlocked = (lessonIndex: number, contentIndex: number) => {
    if (lessonIndex === 0 && contentIndex === 0) return true;
    
    const currentLesson = lessons[lessonIndex];
    if (contentIndex === 0) {
      // First content of lesson - check if previous lesson is completed
      const prevLesson = lessons[lessonIndex - 1];
      if (!prevLesson) return true;
      return prevLesson.contents.every(c => completedContents.has(c.id));
    }
    
    // Check if previous content is completed
    const prevContent = currentLesson.contents[contentIndex - 1];
    return completedContents.has(prevContent.id);
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <div className="flex items-start space-x-6">
          <img
            src={course.thumbnail || 'https://via.placeholder.com/200'}
            alt={course.title}
            className="w-48 h-48 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              {isCompleted && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/student/courses/${courseId}/certificate`)}
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                  ดูใบประกาศนียบัตร
                </Button>
              )}
            </div>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">ความคืบหน้า</span>
                <span className="font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lessons */}
      <div className="space-y-6">
        {lessons.map((lesson, lessonIndex) => (
          <Card key={lesson.id}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {lesson.title}
            </h2>
            {lesson.description && (
              <p className="text-gray-600 mb-4">{lesson.description}</p>
            )}

            <div className="space-y-3">
              {lesson.contents.map((content, contentIndex) => {
                const isCompleted = completedContents.has(content.id);
                const isUnlocked = isContentUnlocked(lessonIndex, contentIndex);
                const hasScore = quizScores[content.id] !== undefined;

                return (
                  <div
                    key={content.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isUnlocked
                        ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {isUnlocked ? (
                          <>
                            {content.type === 'video' && (
                              <VideoCameraIcon className="h-6 w-6 text-blue-600" />
                            )}
                            {content.type === 'document' && (
                              <DocumentTextIcon className="h-6 w-6 text-green-600" />
                            )}
                            {(content.type === 'quiz' || content.type === 'pre_test') && (
                              <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" />
                            )}
                            {content.type === 'live_link' && (
                              <VideoCameraIcon className="h-6 w-6 text-red-600" />
                            )}
                          </>
                        ) : (
                          <LockClosedIcon className="h-6 w-6 text-gray-400" />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{content.title}</h3>
                            {isCompleted && (
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            )}
                            {hasScore && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                คะแนน: {quizScores[content.id]}%
                              </span>
                            )}
                          </div>
                          {content.duration && (
                            <p className="text-sm text-gray-500 mt-1">
                              <ClockIcon className="h-4 w-4 inline mr-1" />
                              {content.duration} นาที
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isUnlocked ? (
                          <Button
                            variant={isCompleted ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleContentClick(content)}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                                ดูอีกครั้ง
                              </>
                            ) : (
                              <>
                                <PlayIcon className="h-4 w-4 mr-2 inline" />
                                {content.type === 'quiz' || content.type === 'pre_test'
                                  ? 'ทำแบบทดสอบ'
                                  : content.type === 'live_link'
                                  ? 'เข้าห้องเรียน'
                                  : 'เริ่มเรียน'}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">ล็อค</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {lessons.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">ยังไม่มีเนื้อหาในหลักสูตรนี้</p>
          </div>
        </Card>
      )}

      {/* Video Player Modal */}
      <VideoPlayer
        isOpen={videoPlayer.isOpen}
        onClose={() => setVideoPlayer({ ...videoPlayer, isOpen: false })}
        title={videoPlayer.title}
        videoUrl={videoPlayer.videoUrl}
        fileUrl={videoPlayer.fileUrl}
        onComplete={() => {
          // Mark content as completed when video ends
          const contentId = lessons
            .flatMap(lesson => lesson.contents)
            .find(c => c.title === videoPlayer.title)?.id;
          if (contentId) {
            setCompletedContents(new Set([...completedContents, contentId]));
          }
          setVideoPlayer({ ...videoPlayer, isOpen: false });
        }}
      />
    </div>
  );
}

