'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationsApi, type Notification } from '@/lib/api';
import Link from 'next/link';
// Helper function to format time ago
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  return `${Math.floor(diffInSeconds / 604800)} สัปดาห์ที่แล้ว`;
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications({ limit: 20 }),
        notificationsApi.getUnreadCount(),
      ]);

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications);
        setUnreadCount(notificationsResponse.data.unreadCount);
      }

      if (countResponse.success) {
        setUnreadCount(countResponse.data.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'assignment':
        return '📝';
      case 'exam':
        return '📋';
      case 'grade':
        return '📊';
      case 'course':
        return '📚';
      case 'system':
        return '⚙️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'assignment':
        return 'bg-blue-50 border-blue-200';
      case 'exam':
        return 'bg-purple-50 border-purple-200';
      case 'grade':
        return 'bg-indigo-50 border-indigo-200';
      case 'course':
        return 'bg-teal-50 border-teal-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">กำลังโหลด...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">ไม่มีการแจ้งเตือน</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.read) {
                                handleMarkAsRead(notification.id, {} as React.MouseEvent);
                              }
                              setIsOpen(false);
                            }}
                            className="block"
                          >
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </Link>
                        ) : (
                          <div>
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                            title="ทำเครื่องหมายว่าอ่านแล้ว"
                          >
                            อ่าน
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="text-xs text-red-600 hover:text-red-700"
                          title="ลบ"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
