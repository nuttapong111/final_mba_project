import apiClient from './client';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  dueDate?: string;
  maxScore: number;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  submissions?: AssignmentSubmission[];
  _count?: {
    submissions: number;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  dueDate?: string;
  maxScore?: number;
  order?: number;
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  dueDate?: string;
  maxScore?: number;
  order?: number;
}

export interface SubmitAssignmentRequest {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

export interface GradeAssignmentRequest {
  score: number;
  feedback?: string;
}

export const assignmentsApi = {
  getByCourse: async (courseId: string): Promise<{
    success: boolean;
    data: Assignment[];
    error?: string;
  }> => {
    const response = await apiClient.get(`/assignments/courses/${courseId}`);
    return response.data;
  },

  getById: async (id: string): Promise<{
    success: boolean;
    data: Assignment;
    error?: string;
  }> => {
    const response = await apiClient.get(`/assignments/${id}`);
    return response.data;
  },

  create: async (data: CreateAssignmentRequest): Promise<{
    success: boolean;
    data: Assignment;
    error?: string;
  }> => {
    const response = await apiClient.post('/assignments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAssignmentRequest): Promise<{
    success: boolean;
    data: Assignment;
    error?: string;
  }> => {
    const response = await apiClient.put(`/assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  },

  submit: async (id: string, data: SubmitAssignmentRequest): Promise<{
    success: boolean;
    data: AssignmentSubmission;
    error?: string;
  }> => {
    try {
      const response = await apiClient.post(`/assignments/${id}/submit`, data);
      return response.data;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถส่งการบ้านได้';
      return {
        success: false,
        error: errorMessage,
      } as any;
    }
  },

  grade: async (submissionId: string, data: GradeAssignmentRequest): Promise<{
    success: boolean;
    data: AssignmentSubmission;
    error?: string;
  }> => {
    const response = await apiClient.post(`/assignments/submissions/${submissionId}/grade`, data);
    return response.data;
  },
};

