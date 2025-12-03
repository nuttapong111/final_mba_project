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
  timeSpent?: number; // in minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  points: number;
  explanation?: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

export interface QuizData {
  quizSettings: {
    totalQuestions?: number;
    duration?: number;
    passingPercentage: number;
    maxAttempts?: number;
  };
  questions: QuizQuestion[];
}

export const examsApi = {
  getByCourse: async (courseId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => {
    const response = await apiClient.get(`/exams/courses/${courseId}`);
    return response.data;
  },

  getQuizQuestions: async (contentId: string): Promise<{
    success: boolean;
    data?: QuizData;
    error?: string;
  }> => {
    const response = await apiClient.get(`/quiz/content/${contentId}/questions`);
    return response.data;
  },

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
    try {
      const response = await apiClient.post(`/exams/${examId}/submit`, data);
      return response.data;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถส่งข้อสอบได้';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  submitQuiz: async (contentId: string, data: SubmitExamData): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    try {
      const response = await apiClient.post(`/quiz/content/${contentId}/submit`, {
        answers: data.answers,
        timeSpent: data.timeSpent,
      });
      return response.data;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถส่งข้อสอบได้';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  deleteQuizSubmission: async (contentId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/quiz/content/${contentId}/submission`);
    return response.data;
  },
};


