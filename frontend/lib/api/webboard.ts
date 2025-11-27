import apiClient from './client';

export interface WebboardPost {
  id: string;
  courseId: string;
  studentId: string;
  question: string;
  student: {
    id: string;
    name: string;
    avatar?: string;
  };
  replies: WebboardReply[];
  createdAt: string;
  updatedAt: string;
}

export interface WebboardReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const webboardApi = {
  getPosts: async (courseId: string): Promise<{
    success: boolean;
    data?: WebboardPost[];
    error?: string;
  }> => {
    const response = await apiClient.get(`/webboard/courses/${courseId}`);
    return response.data;
  },

  createPost: async (courseId: string, question: string): Promise<{
    success: boolean;
    data?: WebboardPost;
    error?: string;
  }> => {
    const response = await apiClient.post(`/webboard/courses/${courseId}/posts`, { question });
    return response.data;
  },

  replyToPost: async (postId: string, content: string): Promise<{
    success: boolean;
    data?: WebboardReply;
    error?: string;
  }> => {
    const response = await apiClient.post(`/webboard/posts/${postId}/replies`, { content });
    return response.data;
  },
};


