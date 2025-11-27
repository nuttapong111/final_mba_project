import apiClient from './client';
import { normalizeRole } from '../utils';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  schoolId?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    token: string;
  };
  error?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    if (response.data.success && response.data.data) {
      // Store token and user
      if (typeof window !== 'undefined') {
        const normalizedUser = {
          ...response.data.data.user,
          role: normalizeRole(response.data.data.user.role),
        };
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

