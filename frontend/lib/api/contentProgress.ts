import { apiClient } from './client';

export interface ContentProgress {
  id: string;
  contentId: string;
  studentId: string;
  courseId: string;
  completed: boolean;
  completedAt?: string;
  progress: number; // 0-100
  lastPosition?: number; // in seconds
  updatedAt: string;
}

export interface VideoProgressData {
  contentId: string;
  courseId: string;
  currentTime: number; // in seconds
  duration: number; // in seconds
  completed?: boolean;
}

export const contentProgressApi = {
  /**
   * Get progress for a specific content
   */
  getContentProgress: async (contentId: string) => {
    const response = await apiClient.get<{ success: boolean; data: ContentProgress }>(
      `/content-progress/content/${contentId}`
    );
    return response.data;
  },

  /**
   * Update video progress
   */
  updateVideoProgress: async (data: VideoProgressData) => {
    const response = await apiClient.post<{ success: boolean; data: ContentProgress }>(
      '/content-progress/video',
      data
    );
    return response.data;
  },

  /**
   * Mark content as completed
   */
  markContentCompleted: async (contentId: string, courseId: string) => {
    const response = await apiClient.post<{ success: boolean; data: ContentProgress }>(
      '/content-progress/complete',
      { contentId, courseId }
    );
    return response.data;
  },

  /**
   * Get all progress for a course
   */
  getCourseProgress: async (courseId: string) => {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/content-progress/course/${courseId}`
    );
    return response.data;
  },
};


