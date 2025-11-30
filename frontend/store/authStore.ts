// Auth Store using Zustand

import { create } from 'zustand';
import { authApi } from '@/lib/api';
import { normalizeRole } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  schoolId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
      
      const user = response.data.user;
      // Convert role from API format (SCHOOL_ADMIN) to frontend format (school_admin)
      const normalizedUser = {
        ...user,
        role: normalizeRole(user.role),
      };
      set({ user: normalizedUser, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  },
  
  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  
  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  checkAuth: async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            // Verify token by calling /me
            const response = await authApi.getMe();
            if (response.success && response.data) {
              // Convert role from API format to frontend format
              const normalizedUser = {
                ...response.data,
                role: normalizeRole(response.data.role),
              };
              set({ user: normalizedUser, isAuthenticated: true });
              // Update localStorage with fresh user data
              if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(normalizedUser));
              }
            } else {
              // API returned error - user not found or invalid
                authApi.logout();
                set({ user: null, isAuthenticated: false });
            }
          } catch (apiError: any) {
            // Any error from API means authentication failed
            // Clear storage and logout
                authApi.logout();
                set({ user: null, isAuthenticated: false });
          }
        } else {
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Don't clear storage on unexpected errors, just set to not authenticated
      set({ user: null, isAuthenticated: false });
    }
  },
}));

