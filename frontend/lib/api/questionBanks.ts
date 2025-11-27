import apiClient from './client';

export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  questionCount?: number;
  createdAt: string;
}

export interface QuestionBank {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  categories: QuestionCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateQuestionCategoryRequest {
  name?: string;
  description?: string;
}

export const questionBanksApi = {
  getByCourse: async (courseId: string): Promise<{
    success: boolean;
    data: QuestionBank;
    error?: string;
  }> => {
    const response = await apiClient.get(`/question-banks/courses/${courseId}`);
    return response.data;
  },

  createCategory: async (questionBankId: string, data: CreateQuestionCategoryRequest): Promise<{
    success: boolean;
    data: QuestionCategory;
    error?: string;
  }> => {
    const response = await apiClient.post(`/question-banks/${questionBankId}/categories`, data);
    return response.data;
  },

  updateCategory: async (categoryId: string, data: UpdateQuestionCategoryRequest): Promise<{
    success: boolean;
    data: QuestionCategory;
    error?: string;
  }> => {
    const response = await apiClient.put(`/question-banks/categories/${categoryId}`, data);
    return response.data;
  },

  deleteCategory: async (categoryId: string): Promise<{
    success: boolean;
    data: { message: string };
    error?: string;
  }> => {
    const response = await apiClient.delete(`/question-banks/categories/${categoryId}`);
    return response.data;
  },

  getQuestions: async (questionBankId: string, filters?: {
    categoryId?: string;
    difficulty?: string;
    search?: string;
  }): Promise<{
    success: boolean;
    data: any[];
    error?: string;
  }> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    const url = `/question-banks/${questionBankId}/questions${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  deleteQuestion: async (questionId: string): Promise<{
    success: boolean;
    data: { message: string };
    error?: string;
  }> => {
    const response = await apiClient.delete(`/question-banks/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (questionBankId: string, data: {
    question: string;
    type: string;
    categoryId?: string;
    difficulty: string;
    points: number;
    explanation?: string;
    options?: Array<{ text: string; isCorrect: boolean; order: number }>;
    correctAnswer?: string;
  }): Promise<{
    success: boolean;
    data: any;
    error?: string;
  }> => {
    const response = await apiClient.post(`/question-banks/${questionBankId}/questions`, data);
    return response.data;
  },
};

