'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { coursesApi, webboardApi } from '@/lib/api';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

export default function StudentWebboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, postsResponse] = await Promise.all([
        coursesApi.getById(courseId),
        webboardApi.getPosts(courseId),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
      }

      if (postsResponse.success && postsResponse.data) {
        setPosts(postsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching webboard data:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลได้',
      });
    } finally {
      setLoading(false);
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
        fetchData();
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
        fetchData();
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
      <Card>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">กระดานสนทนา</h1>
          <p className="text-gray-600 mt-1">{course?.title}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowNewPost(!showNewPost)}>
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 inline" />
          ตั้งคำถามใหม่
        </Button>
      </div>

      {showNewPost && (
        <Card>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="กรอกคำถามของคุณ..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowNewPost(false);
                setNewQuestion('');
              }}>
                ยกเลิก
              </Button>
              <Button onClick={handleCreatePost}>
                <PaperAirplaneIcon className="h-5 w-5 mr-2 inline" />
                ส่งคำถาม
              </Button>
            </div>
          </div>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีคำถามในกระดานสนทนา</p>
            <p className="text-sm text-gray-500 mt-2">เป็นคนแรกที่ตั้งคำถาม!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="space-y-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                      <Button size="sm" onClick={() => handleReply(post.id)}>
                        <PaperAirplaneIcon className="h-4 w-4 mr-1 inline" />
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
  );
}


