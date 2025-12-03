import apiClient from './client';

export interface PollQuestion {
  id?: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'checkbox' | 'rating';
  required: boolean;
  options?: string[];
  order: number;
  minRating?: number;
  maxRating?: number;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  questions: PollQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface PollListItem {
  id: string;
  title: string;
  lessonTitle: string;
  lessonId: string;
  contentId: string;
  poll: Poll;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  questions: Array<{
    question: string;
    type: string;
    required: boolean;
    options?: string[];
    order: number;
  }>;
}

export interface UpdatePollRequest {
  title?: string;
  description?: string;
  questions?: Array<{
    id?: string;
    question: string;
    type: string;
    required: boolean;
    options?: string[];
    order: number;
  }>;
}

export interface SubmitPollRequest {
  answers: Array<{
    questionId: string;
    answer: string | string[] | number;
  }>;
}

export const pollsApi = {
  getByCourse: async (courseId: string): Promise<{
    success: boolean;
    data: PollListItem[];
    error?: string;
  }> => {
    const response = await apiClient.get(`/polls/courses/${courseId}`);
    return response.data;
  },

  create: async (courseId: string, data: CreatePollRequest): Promise<{
    success: boolean;
    data: Poll;
    error?: string;
  }> => {
    const response = await apiClient.post(`/polls/courses/${courseId}`, data);
    return response.data;
  },

  update: async (pollId: string, data: UpdatePollRequest): Promise<{
    success: boolean;
    data: Poll;
    error?: string;
  }> => {
    const response = await apiClient.put(`/polls/${pollId}`, data);
    return response.data;
  },

  delete: async (pollId: string): Promise<{
    success: boolean;
    data: { message: string };
    error?: string;
  }> => {
    const response = await apiClient.delete(`/polls/${pollId}`);
    return response.data;
  },

  getResponseStatus: async (pollId: string): Promise<{
    success: boolean;
    data?: {
      submitted: boolean;
      submittedAt?: string;
    };
    error?: string;
  }> => {
    try {
      const response = await apiClient.get(`/polls/${pollId}/status`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถตรวจสอบสถานะได้';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  submit: async (pollId: string, data: SubmitPollRequest): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      const response = await apiClient.post(`/polls/${pollId}/submit`, data);
      return response.data;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถส่งแบบประเมินได้';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

