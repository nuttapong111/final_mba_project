'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { webboardApi, coursesApi } from '@/lib/api';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Post {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  question: string;
  createdAt: string;
  replies?: Reply[];
}

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'teacher' | 'student';
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export default function TeacherWebboardPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsResponse, coursesResponse] = await Promise.all([
        webboardApi.getTeacherPosts(),
        coursesApi.getCourses(),
      ]);

      if (postsResponse.success && postsResponse.data) {
        // Transform API data to match component format
        const transformedPosts = postsResponse.data.map((post: any) => ({
          id: post.id,
          courseId: post.courseId,
          courseTitle: post.course?.title || '',
          studentId: post.studentId,
          studentName: post.student?.name || 'นักเรียน',
          studentAvatar: post.student?.avatar,
          question: post.question,
          createdAt: post.createdAt,
          replies: post.replies?.map((reply: any) => ({
            id: reply.id,
            authorId: reply.authorId,
            authorName: reply.author?.name || '',
            authorRole: reply.author?.role === 'TEACHER' ? 'teacher' : 'student',
            authorAvatar: reply.author?.avatar,
            content: reply.content,
            createdAt: reply.createdAt,
          })) || [],
        }));
        setPosts(transformedPosts);
      }

      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching webboard data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
    }
  };
    {
      id: '1',
      courseId: '1',
      courseTitle: 'คณิตศาสตร์ ม.4',
      studentId: '4',
      studentName: 'นักเรียน ดีใจ',
      studentAvatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
      question: 'อาจารย์ครับ ไม่เข้าใจเรื่องการแก้สมการกำลังสอง ช่วยอธิบายให้หน่อยได้ไหมครับ?',
      createdAt: '2024-03-15T10:30:00',
      replies: [],
    },
    {
      id: '2',
      courseId: '1',
      courseTitle: 'คณิตศาสตร์ ม.4',
      studentId: '7',
      studentName: 'นักเรียน สมชาย',
      studentAvatar: 'https://ui-avatars.com/api/?name=สมชาย&background=3b82f6&color=fff',
      question: 'อาจารย์ครับ ข้อสอบข้อที่ 5 ใช้สูตรอะไรในการแก้ครับ?',
      createdAt: '2024-03-15T14:20:00',
      replies: [
        {
          id: 'r1',
          authorId: user?.id || '',
          authorName: user?.name || 'อาจารย์',
          authorRole: 'teacher',
          authorAvatar: user?.avatar,
          content: 'ใช้สูตรกำลังสองสมบูรณ์ (a+b)² = a² + 2ab + b² ครับ',
          createdAt: '2024-03-15T15:00:00',
        },
      ],
    },
    {
      id: '3',
      courseId: '2',
      courseTitle: 'ภาษาอังกฤษ TOEIC',
      studentId: '4',
      studentName: 'นักเรียน ดีใจ',
      studentAvatar: 'https://ui-avatars.com/api/?name=ดีใจ&background=10b981&color=fff',
      question: 'อาจารย์ครับ คำว่า "however" กับ "but" ใช้ต่างกันอย่างไรครับ?',
      createdAt: '2024-03-16T09:15:00',
      replies: [],
    },
  ]);

  const [replyContents, setReplyContents] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});

  const filteredPosts = posts.filter((post) => {
    const courseMatch = selectedCourse === 'all' || post.courseId === selectedCourse;
    const searchMatch = post.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    return courseMatch && searchMatch;
  });

  const handleReply = async (postId: string) => {
    const content = replyContents[postId]?.trim();
    if (!content) return;

    try {
      const response = await webboardApi.replyToPost(postId, content);
      
      if (response.success && response.data) {
        // Update local state with new reply
        const newReply: Reply = {
          id: response.data.id,
          authorId: response.data.authorId,
          authorName: response.data.author?.name || user?.name || 'อาจารย์',
          authorRole: response.data.author?.role === 'TEACHER' ? 'teacher' : 'student',
          authorAvatar: response.data.author?.avatar,
          content: response.data.content,
          createdAt: response.data.createdAt,
        };

        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, replies: [...(post.replies || []), newReply] }
            : post
        ));

        setReplyContents({ ...replyContents, [postId]: '' });
        setShowReplyInput({ ...showReplyInput, [postId]: false });

        await Swal.fire({
          icon: 'success',
          title: 'ส่งคำตอบสำเร็จ!',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.error || 'ไม่สามารถส่งคำตอบได้');
      }
    } catch (error: any) {
      console.error('Error replying to post:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งคำตอบได้',
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webboard</h1>
        <p className="text-gray-600 mt-1">ตอบคำถามของนักเรียนในรายวิชาที่คุณสอน</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาคำถาม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทุกหลักสูตร</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Posts List */}
      {loading ? (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ไม่พบคำถาม</p>
              </div>
            </Card>
          ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <div className="space-y-4">
                {/* Post Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <img
                      src={post.studentAvatar || 'https://ui-avatars.com/api/?name=Student'}
                      alt={post.studentName}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{post.studentName}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {post.courseTitle}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDateTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Question */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.question}</p>
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start space-x-3">
                        <img
                          src={reply.authorAvatar || 'https://ui-avatars.com/api/?name=Teacher'}
                          alt={reply.authorName}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{reply.authorName}</span>
                            {reply.authorRole === 'teacher' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                อาจารย์
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDateTime(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {showReplyInput[post.id] ? (
                  <div className="space-y-2">
                    <textarea
                      value={replyContents[post.id] || ''}
                      onChange={(e) =>
                        setReplyContents({ ...replyContents, [post.id]: e.target.value })
                      }
                      placeholder="พิมพ์คำตอบ..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReplyInput({ ...showReplyInput, [post.id]: false });
                          setReplyContents({ ...replyContents, [post.id]: '' });
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button onClick={() => handleReply(post.id)}>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2 inline" />
                        ส่งคำตอบ
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowReplyInput({ ...showReplyInput, [post.id]: true })}
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2 inline" />
                    ตอบคำถาม
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

