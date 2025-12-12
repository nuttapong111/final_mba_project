import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import {
  getNotificationsController,
  createNotificationController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  deleteNotificationController,
  getUnreadCountController,
} from '../controllers/notificationController';

const notificationRoutes = new Hono();

// All routes require authentication
notificationRoutes.use('/*', authMiddleware);

// Get notifications for current user
notificationRoutes.get('/', getNotificationsController);

// Get unread count
notificationRoutes.get('/unread-count', getUnreadCountController);

// Create notification (admin only)
notificationRoutes.post('/', createNotificationController);

// Mark notification as read
notificationRoutes.patch('/:id/read', markNotificationAsReadController);

// Mark all notifications as read
notificationRoutes.patch('/read-all', markAllNotificationsAsReadController);

// Delete notification
notificationRoutes.delete('/:id', deleteNotificationController);

export default notificationRoutes;
