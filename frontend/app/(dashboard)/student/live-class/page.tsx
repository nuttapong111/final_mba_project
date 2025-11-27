'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockCourses } from '@/lib/mockData';
import { filterCoursesByRole } from '@/lib/utils';
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface LiveSession {
  id: string;
  courseId: string;
  courseTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  meetingId?: string;
  meetingPassword?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export default function StudentLiveClassPage() {
  const { user } = useAuthStore();
  const enrolledCourses = filterCoursesByRole(mockCourses, user);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'live' | 'completed'>('all');

  // Get live sessions from enrolled courses
  const allSessions: LiveSession[] = enrolledCourses
    .filter((course) => course.liveSessions && course.liveSessions.length > 0)
    .flatMap((course) =>
      (course.liveSessions || []).map((session) => ({
        id: session.id,
        courseId: course.id,
        courseTitle: course.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        meetingLink: session.meetingLink,
        meetingId: session.meetingId,
        meetingPassword: session.meetingPassword,
        status: session.status as 'scheduled' | 'live' | 'completed' | 'cancelled',
      }))
    );

  const filteredSessions = allSessions.filter((session) => {
    if (selectedStatus === 'all') return true;
    return session.status === selectedStatus;
  });

  const handleJoinClass = (session: LiveSession) => {
    Swal.fire({
      title: 'เข้าห้องเรียนออนไลน์',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>หลักสูตร:</strong> ${session.courseTitle}</p>
          <p class="mb-2"><strong>วันที่:</strong> ${new Date(session.date).toLocaleDateString('th-TH')}</p>
          <p class="mb-2"><strong>เวลา:</strong> ${session.startTime} - ${session.endTime}</p>
          <p class="mb-2"><strong>Meeting Link:</strong> ${session.meetingLink}</p>
          ${session.meetingPassword ? `<p><strong>Password:</strong> ${session.meetingPassword}</p>` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'เข้าห้องเรียน',
      showCancelButton: true,
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        // In real app, this would open the meeting link
        window.open(session.meetingLink, '_blank');
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'กำหนดสอน',
      live: 'กำลังสอน',
      completed: 'สอนเสร็จแล้ว',
      cancelled: 'ยกเลิก',
    };
    return labels[status] || status;
  };

  const scheduledCount = allSessions.filter((s) => s.status === 'scheduled').length;
  const liveCount = allSessions.filter((s) => s.status === 'live').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ห้องเรียนออนไลน์</h1>
        <p className="text-gray-600 mt-1">เข้าห้องเรียนออนไลน์ตามวันเวลาที่กำหนด</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">กำหนดสอน</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{scheduledCount}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">กำลังสอน</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{liveCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <VideoCameraIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">สถานะ:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">ทั้งหมด</option>
            <option value="scheduled">กำหนดสอน</option>
            <option value="live">กำลังสอน</option>
            <option value="completed">สอนเสร็จแล้ว</option>
          </select>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSessions.length === 0 ? (
          <Card className="col-span-2">
            <div className="text-center py-12">
              <VideoCameraIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบห้องเรียนออนไลน์</p>
            </div>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} hover>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{session.courseTitle}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>
                      {session.startTime} - {session.endTime}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-200">
                  {(session.status === 'scheduled' || session.status === 'live') && (
                    <Button
                      onClick={() => handleJoinClass(session)}
                      className="w-full"
                      variant={session.status === 'live' ? 'primary' : 'outline'}
                    >
                      <PlayIcon className="h-4 w-4 mr-2 inline" />
                      {session.status === 'live' ? 'เข้าห้องเรียน' : 'รอเข้าห้องเรียน'}
                    </Button>
                  )}
                  {session.status === 'completed' && (
                    <Button variant="outline" className="w-full" disabled>
                      สอนเสร็จแล้ว
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

