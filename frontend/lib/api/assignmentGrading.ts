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
    assignmentTitle: string;
    assignmentDescription?: string;
    studentNotes?: string;
    maxScore: number;
  }): Promise<{
    success: boolean;
    data?: { score: number; feedback: string };
    error?: string;
  }> => {
    const response = await apiClient.post('/assignment-grading/ai-feedback', data);
    return response.data;
  },
};

