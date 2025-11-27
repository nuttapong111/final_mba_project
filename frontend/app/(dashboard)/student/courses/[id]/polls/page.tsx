'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  mockCourses,
  getCourseWithLessons,
  type Poll,
} from '@/lib/mockData';

interface PollStatus {
  pollId: string;
  completed: boolean;
  completedAt?: string;
}

export default function StudentPollsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const course = mockCourses.find(c => c.id === courseId);
  const courseWithLessons = getCourseWithLessons(courseId);

  // Mock data สำหรับสถานะการทำแบบประเมิน
  const [pollStatuses] = useState<Record<string, PollStatus>>({
    // 'poll-1': { pollId: 'poll-1', completed: true, completedAt: '2024-01-15' },
  });

  // ดึง polls ทั้งหมดจาก lessons
  const getAllPolls = () => {
    if (!courseWithLessons?.lessons) return [];
    const polls: Array<{ 
      id: string; 
      title: string; 
      lessonTitle: string; 
      poll: Poll;
      contentId: string;
    }> = [];
    
    courseWithLessons.lessons.forEach((lesson) => {
      lesson.contents.forEach((content) => {
        if (content.type === 'poll' && content.poll) {
          polls.push({
            id: content.id,
            title: content.title || content.poll.title,
            lessonTitle: lesson.title,
            poll: content.poll,
            contentId: content.id,
          });
        }
      });
    });
    
    return polls;
  };

  const allPolls = getAllPolls();

  const handleTakePoll = (pollId: string) => {
    router.push(`/student/courses/${courseId}/poll/${pollId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แบบประเมิน</h1>
        <p className="text-gray-600 mt-1">{course?.title}</p>
      </div>

      {allPolls.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ยังไม่มีแบบประเมิน</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {allPolls.map((pollItem) => {
            const status = pollStatuses[pollItem.id];
            const isCompleted = status?.completed || false;

            return (
              <Card key={pollItem.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{pollItem.title}</h3>
                        <p className="text-sm text-gray-500">{pollItem.lessonTitle}</p>
                      </div>
                      {isCompleted && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center space-x-1">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>ทำเสร็จแล้ว</span>
                        </span>
                      )}
                    </div>
                    {pollItem.poll.description && (
                      <p className="text-gray-600 mb-3">{pollItem.poll.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {pollItem.poll.questions.length} คำถาม
                      </span>
                      {isCompleted && status.completedAt && (
                        <span>
                          ทำเมื่อ: {new Date(status.completedAt).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {isCompleted ? (
                      <Button variant="outline" disabled>
                        <CheckCircleIcon className="h-5 w-5 mr-2 inline" />
                        ทำเสร็จแล้ว
                      </Button>
                    ) : (
                      <Button onClick={() => handleTakePoll(pollItem.id)}>
                        <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 inline" />
                        ทำแบบประเมิน
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

