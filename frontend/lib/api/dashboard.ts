import apiClient from './client';

export interface SchoolDashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalExams: number;
  averageScore: number;
  completionRate: number;
  activeUsers: number;
}

export interface AdminDashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalRevenue: number;
  growthRate: number;
}

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalExams: number;
  pendingGradingTasks: number;
}

export interface StudentDashboardStats {
  totalCourses: number;
  todaySessions: number;
  completedCourses: number;
  certificates: number;
}

export const dashboardApi = {
  getSchoolDashboard: async (): Promise<{ success: boolean; data: SchoolDashboardStats; error?: string }> => {
    const response = await apiClient.get('/dashboard/school');
    return response.data;
  },

  getAdminDashboard: async (): Promise<{ success: boolean; data: AdminDashboardStats; error?: string }> => {
    const response = await apiClient.get('/dashboard/admin');
    return response.data;
  },

  getTeacherDashboard: async (): Promise<{ success: boolean; data: TeacherDashboardStats; error?: string }> => {
    const response = await apiClient.get('/dashboard/teacher');
    return response.data;
  },

  getStudentDashboard: async (): Promise<{ success: boolean; data: StudentDashboardStats; error?: string }> => {
    const response = await apiClient.get('/dashboard/student');
    return response.data;
  },
};


