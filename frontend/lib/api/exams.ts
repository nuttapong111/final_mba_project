import apiClient from './client';

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'essay';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number;
  passingPercentage: number;
  questions: ExamQuestion[];
}

export interface SubmitExamData {
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
}

export const examsApi = {
  getExamByContent: async (contentId: string): Promise<{
    success: boolean;
    data?: Exam;
    error?: string;
  }> => {
    // This will be implemented when we have the API endpoint
    // For now, we'll get exam from course content
    const response = await apiClient.get(`/courses/content/${contentId}/exam`);
    return response.data;
  },

  submitExam: async (examId: string, data: SubmitExamData): Promise<{
    success: boolean;
    data?: {
      score: number;
      passed: boolean;
      correctAnswers: number;
      totalQuestions: number;
    };
    error?: string;
  }> => {
    const response = await apiClient.post(`/exams/${examId}/submit`, data);
    return response.data;
  },
};


