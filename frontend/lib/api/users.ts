import apiClient from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  schoolId?: string;
  createdAt: string;
}

export interface BulkImportRequest {
  users: Array<{
    name: string;
    email: string;
    role: string;
    password?: string;
    schoolId?: string;
  }>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  schoolId?: string;
}

export const usersApi = {
  getAll: async (): Promise<{ success: boolean; data: User[]; error?: string }> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  create: async (data: CreateUserRequest): Promise<{
    success: boolean;
    data: User;
    error?: string;
  }> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  bulkImport: async (data: BulkImportRequest): Promise<{
    success: boolean;
    data: {
      success: User[];
      failed: Array<{ user: any; error: string }>;
    };
    error?: string;
  }> => {
    const response = await apiClient.post('/users/bulk-import', data);
    return response.data;
  },
};

