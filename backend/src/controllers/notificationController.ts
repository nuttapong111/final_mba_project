import { Context } from 'hono';
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from '../services/notificationService';

/**
 * Get notifications for the current user
 */
export const getNotificationsController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const read = c.req.query('read');
    const type = c.req.query('type');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

    const filters: any = { limit, offset };
    if (read !== undefined) filters.read = read === 'true';
    if (type) filters.type = type;

    const result = await getNotifications(user.id, filters);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[NOTIFICATION] Error getting notifications:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Create a notification (for admin/system use)
 */
export const createNotificationController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Only SUPER_ADMIN and SCHOOL_ADMIN can create notifications
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }

    const body = await c.req.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !title || !message || !type) {
      return c.json(
        { success: false, error: 'Missing required fields: userId, title, message, type' },
        400
      );
    }

    const notification = await createNotification({
      userId,
      title,
      message,
      type,
      link,
    });

    return c.json({ success: true, data: notification }, 201);
  } catch (error: any) {
    console.error('[NOTIFICATION] Error creating notification:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsReadController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const result = await markNotificationAsRead(notificationId, user.id);

    if (result.count === 0) {
      return c.json({ success: false, error: 'Notification not found' }, 404);
    }

    return c.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error: any) {
    console.error('[NOTIFICATION] Error marking notification as read:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const result = await markAllNotificationsAsRead(user.id);
    return c.json({
      success: true,
      data: { message: `${result.count} notifications marked as read` },
    });
  } catch (error: any) {
    console.error('[NOTIFICATION] Error marking all notifications as read:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Delete a notification
 */
export const deleteNotificationController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const notificationId = c.req.param('id');
    const result = await deleteNotification(notificationId, user.id);

    if (result.count === 0) {
      return c.json({ success: false, error: 'Notification not found' }, 404);
    }

    return c.json({ success: true, data: { message: 'Notification deleted' } });
  } catch (error: any) {
    console.error('[NOTIFICATION] Error deleting notification:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Get unread count
 */
export const getUnreadCountController = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const count = await getUnreadCount(user.id);
    return c.json({ success: true, data: { count } });
  } catch (error: any) {
    console.error('[NOTIFICATION] Error getting unread count:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};
