import { Context } from 'hono';
import {
  getContentProgress,
  updateVideoProgress,
  markContentCompleted,
  getCourseProgress,
} from '../services/contentProgressService';

/**
 * Get progress for a specific content
 */
export const getContentProgressController = async (c: Context) => {
  try {
    const user = c.get('user');
    const contentId = c.req.param('contentId');

    if (!contentId) {
      return c.json({ success: false, error: 'Content ID is required' }, 400);
    }

    const progress = await getContentProgress(contentId, user.id);

    return c.json({
      success: true,
      data: progress || {
        progress: 0,
        lastPosition: 0,
        completed: false,
      },
    });
  } catch (error: any) {
    console.error('[ContentProgress] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Update video progress
 */
export const updateVideoProgressController = async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { contentId, courseId, currentTime, duration, completed } = body;

    if (!contentId || !courseId || currentTime === undefined || duration === undefined) {
      return c.json(
        { success: false, error: 'Missing required fields' },
        400
      );
    }

    const progress = await updateVideoProgress(
      {
        contentId,
        courseId,
        currentTime: Number(currentTime),
        duration: Number(duration),
        completed: Boolean(completed),
      },
      user.id
    );

    return c.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('[ContentProgress] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Mark content as completed
 */
export const markContentCompletedController = async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { contentId, courseId } = body;

    if (!contentId || !courseId) {
      return c.json(
        { success: false, error: 'Content ID and Course ID are required' },
        400
      );
    }

    const progress = await markContentCompleted(contentId, courseId, user.id);

    return c.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('[ContentProgress] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

/**
 * Get all progress for a course
 */
export const getCourseProgressController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');

    if (!courseId) {
      return c.json({ success: false, error: 'Course ID is required' }, 400);
    }

    const course = await getCourseProgress(courseId, user.id);

    return c.json({ success: true, data: course });
  } catch (error: any) {
    console.error('[ContentProgress] Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
};

