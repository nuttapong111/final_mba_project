import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'exam' | 'grade' | 'course' | 'system';
  link?: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get notifications for a user
 */
export const getNotifications = async (
  userId: string,
  filters: NotificationFilters = {}
) => {
  const { read, type, limit = 50, offset = 0 } = filters;

  const where: any = { userId };
  if (read !== undefined) where.read = read;
  if (type) where.type = type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    unreadCount: await prisma.notification.count({
      where: { userId, read: false },
    }),
  };
};

/**
 * Create a notification
 */
export const createNotification = async (data: CreateNotificationData) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
    },
  });
};

/**
 * Create multiple notifications for multiple users
 */
export const createNotificationsForUsers = async (
  userIds: string[],
  data: Omit<CreateNotificationData, 'userId'>
) => {
  const notifications = userIds.map((userId) => ({
    userId,
    title: data.title,
    message: data.message,
    type: data.type,
    link: data.link,
  }));

  return prisma.notification.createMany({
    data: notifications,
  });
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string) => {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
  });
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
};
