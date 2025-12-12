import { apiClient } from './client';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'exam' | 'grade' | 'course' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  /**
   * Get notifications for current user
   */
  getNotifications: async (params?: {
    read?: boolean;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: NotificationListResponse; error?: string }> => {
    const queryParams = new URLSearchParams();
    if (params?.read !== undefined) queryParams.append('read', params.read.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get(`/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    return response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ success: boolean; data: UnreadCountResponse; error?: string }> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Create a notification (admin only)
   */
  createNotification: async (data: {
    userId: string;
    title: string;
    message: string;
    type: Notification['type'];
    link?: string;
  }): Promise<{ success: boolean; data: Notification; error?: string }> => {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },
};
