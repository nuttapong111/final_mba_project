import apiClient from './client';

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

export const courseCategoriesApi = {
  getAll: async (): Promise<{ success: boolean; data: CourseCategory[]; error?: string }> => {
    const response = await apiClient.get('/course-categories');
    return response.data;
  },

  create: async (data: CreateCategoryRequest): Promise<{
    success: boolean;
    data: CourseCategory;
    error?: string;
  }> => {
    const response = await apiClient.post('/course-categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryRequest): Promise<{
    success: boolean;
    data: CourseCategory;
    error?: string;
  }> => {
    const response = await apiClient.put(`/course-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{
    success: boolean;
    data: { success: boolean };
    error?: string;
  }> => {
    const response = await apiClient.delete(`/course-categories/${id}`);
    return response.data;
  },
};

