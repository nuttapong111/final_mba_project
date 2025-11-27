'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

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
  const myCourses = filterCoursesByRole(mockCourses, user);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock posts data
  const [posts, setPosts] = useState<Post[]>([
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

  const handleReply = (postId: string) => {
    const content = replyContents[postId]?.trim();
    if (!content) return;

    const newReply: Reply = {
      id: `r${Date.now()}`,
      authorId: user?.id || '',
      authorName: user?.name || 'อาจารย์',
      authorRole: 'teacher',
      authorAvatar: user?.avatar,
      content,
      createdAt: new Date().toISOString(),
    };

    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, replies: [...(post.replies || []), newReply] }
        : post
    ));

    setReplyContents({ ...replyContents, [postId]: '' });
    setShowReplyInput({ ...showReplyInput, [postId]: false });
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
            {myCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Posts List */}
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

