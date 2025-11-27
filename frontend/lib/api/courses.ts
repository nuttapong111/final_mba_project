import apiClient from './client';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  courseType: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  school: {
    id: string;
    name: string;
  };
  teachers?: any[];
  enrolledStudents?: any[];
  students: number;
  rating: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  category: string;
  categoryId?: string;
  level: string;
  courseType: string;
  livePlatform?: string;
  instructorId: string;
  duration: number;
  price: number;
  status: string;
  startDate?: string;
  endDate?: string;
  thumbnail?: string;
}

export const coursesApi = {
  getCourses: async (): Promise<{ success: boolean; data: Course[]; error?: string }> => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getAll: async (): Promise<{ success: boolean; data: Course[]; error?: string }> => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Course; error?: string }> => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data: CreateCourseRequest): Promise<{
    success: boolean;
    data: Course;
    error?: string;
  }> => {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  update: async (courseId: string, data: Partial<CreateCourseRequest>): Promise<{
    success: boolean;
    data: Course;
    error?: string;
  }> => {
    const response = await apiClient.put(`/courses/${courseId}`, data);
    return response.data;
  },

  saveContent: async (courseId: string, lessons: any[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    const response = await apiClient.put(`/courses/${courseId}/content`, { lessons });
    return response.data;
  },

  // Teacher management
  addTeacher: async (courseId: string, teacherId: string, roles: {
    liveTeaching: boolean;
    grading: boolean;
    webboard: boolean;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    const response = await apiClient.post(`/courses/${courseId}/teachers`, {
      teacherId,
      roles,
    });
    return response.data;
  },

  removeTeacher: async (courseId: string, teacherId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/courses/${courseId}/teachers/${teacherId}`);
    return response.data;
  },

  updateTeacherRoles: async (courseId: string, teacherId: string, roles: {
    liveTeaching: boolean;
    grading: boolean;
    webboard: boolean;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    const response = await apiClient.patch(`/courses/${courseId}/teachers/${teacherId}/roles`, roles);
    return response.data;
  },

  // Student management
  addStudent: async (courseId: string, studentId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    const response = await apiClient.post(`/courses/${courseId}/students`, {
      studentId,
    });
    return response.data;
  },

  removeStudent: async (courseId: string, studentId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/courses/${courseId}/students/${studentId}`);
    return response.data;
  },
};

