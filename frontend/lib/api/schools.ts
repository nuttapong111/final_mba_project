import apiClient from './client';

export interface School {
  id: string;
  name: string;
  domain?: string;
  subscription?: string;
  createdAt: string;
  adminCount?: number;
  userCount?: number;
}

export const schoolsApi = {
  getAll: async (): Promise<{
    success: boolean;
    data?: School[];
    error?: string;
  }> => {
    try {
      const response = await apiClient.get('/schools');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'ไม่สามารถดึงข้อมูลสถาบันได้',
      };
    }
  },

  getById: async (id: string): Promise<{
    success: boolean;
    data?: School;
    error?: string;
  }> => {
    try {
      const response = await apiClient.get(`/schools/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'ไม่สามารถดึงข้อมูลสถาบันได้',
      };
    }
  },

  create: async (data: {
    name: string;
    domain?: string;
    subscription?: string;
  }): Promise<{
    success: boolean;
    data?: School;
    error?: string;
  }> => {
    try {
      const response = await apiClient.post('/schools', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'ไม่สามารถสร้างสถาบันได้',
      };
    }
  },
};
