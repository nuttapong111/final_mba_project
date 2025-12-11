import apiClient from './client';

export interface AssignmentGradingTask {
  id: string;
  courseId: string;
  courseTitle: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  teacherFileUrl?: string;
  teacherFileName?: string;
  teacherS3Key?: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  maxScore: number;
  status: 'pending' | 'graded';
  aiScore?: number;
  aiFeedback?: string;
}

export const assignmentGradingApi = {
  getTasks: async (): Promise<{
    success: boolean;
    data?: AssignmentGradingTask[];
    error?: string;
  }> => {
    const response = await apiClient.get('/assignment-grading/tasks');
    return response.data;
  },

  gradeSubmission: async (
    submissionId: string,
    data: { score: number; feedback?: string }
  ): Promise<{
    success: boolean;
    data?: AssignmentGradingTask;
    error?: string;
  }> => {
    const response = await apiClient.patch(`/assignment-grading/tasks/${submissionId}`, data);
    return response.data;
  },

  generateAIFeedback: async (data: {
    submissionId?: string;
    assignmentTitle: string;
    assignmentDescription?: string;
    studentNotes?: string;
    maxScore: number;
    studentFileUrl?: string;
    studentS3Key?: string;
    studentFileName?: string;
    teacherFileUrl?: string;
    teacherS3Key?: string;
    teacherFileName?: string;
  }): Promise<{
    success: boolean;
    data?: { score: number; feedback: string };
    error?: string;
  }> => {
    // Increase timeout to 3 minutes (180000ms) for PDF processing and AI API calls
    const response = await apiClient.post('/assignment-grading/ai-feedback', data, {
      timeout: 180000, // 3 minutes
    });
    return response.data;
  },

  regenerateAIFeedback: async (submissionId: string): Promise<{
    success: boolean;
    data?: { score: number; feedback: string };
    error?: string;
  }> => {
    try {
      // Increase timeout to 3 minutes (180000ms) for PDF processing and AI API calls
      const response = await apiClient.post(`/assignment-grading/submissions/${submissionId}/regenerate-ai`, {}, {
        timeout: 180000, // 3 minutes
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถสร้างคำแนะนำจาก AI ได้';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

