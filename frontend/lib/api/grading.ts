import apiClient from './client';

export interface GradingTask {
  id: string;
  courseId: string;
  courseTitle: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  questionId: string;
  question: string;
  answer: string;
  aiScore?: number;
  aiFeedback?: string;
  teacherScore?: number;
  teacherFeedback?: string;
  status: 'pending' | 'graded';
  maxScore: number;
}

export interface GradingSystem {
  id: string;
  courseId: string;
  systemType: 'PASS_FAIL' | 'GRADE';
  passingScore?: number;
  createdAt: string;
  updatedAt: string;
  criteria?: GradeCriteria[];
}

export interface GradeCriteria {
  id: string;
  gradingSystemId: string;
  grade: string;
  minScore: number;
  maxScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GradeWeight {
  id: string;
  courseId: string;
  category: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradingSystemRequest {
  courseId: string;
  systemType: 'PASS_FAIL' | 'GRADE';
  passingScore?: number;
}

export interface UpdateGradingSystemRequest {
  systemType?: 'PASS_FAIL' | 'GRADE';
  passingScore?: number;
}

export interface CreateGradeCriteriaRequest {
  gradingSystemId: string;
  grade: string;
  minScore: number;
  maxScore?: number;
}

export interface UpdateGradeCriteriaRequest {
  grade?: string;
  minScore?: number;
  maxScore?: number;
}

export interface CreateGradeWeightRequest {
  courseId: string;
  category: string;
  weight: number;
}

export interface UpdateGradeWeightRequest {
  category?: string;
  weight?: number;
}

export interface StudentGrade {
  percentage: number;
  grade: string;
  systemType: 'PASS_FAIL' | 'GRADE';
}

export interface StudentGradeReport {
  systemType: 'PASS_FAIL' | 'GRADE' | null;
  finalGrade: {
    percentage: number;
    grade: string;
    systemType: 'PASS_FAIL' | 'GRADE';
  } | null;
  categories: Array<{
    category: string;
    weight: number;
    scores: number[];
    average: number;
    percentage: number;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
    status: string;
    hasPendingGrading?: boolean;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    score: number | null;
    maxScore: number;
    percentage: number | null;
    submittedAt: string | null;
    gradedAt: string | null;
    status: 'pending' | 'graded' | 'not_submitted';
  }>;
  exams: Array<{
    id: string;
    title: string;
    type: string;
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
    status: string;
  }>;
}

export const gradingApi = {
  getSystem: async (courseId: string): Promise<{
    success: boolean;
    data: {
      gradingSystem: GradingSystem | null;
      gradeWeights: GradeWeight[];
    };
    error?: string;
  }> => {
    const response = await apiClient.get(`/grading/courses/${courseId}/system`);
    return response.data;
  },

  createSystem: async (data: CreateGradingSystemRequest): Promise<{
    success: boolean;
    data: GradingSystem;
    error?: string;
  }> => {
    const response = await apiClient.post('/grading/system', data);
    return response.data;
  },

  updateSystem: async (courseId: string, data: UpdateGradingSystemRequest): Promise<{
    success: boolean;
    data: GradingSystem;
    error?: string;
  }> => {
    const response = await apiClient.put(`/grading/courses/${courseId}/system`, data);
    return response.data;
  },

  createCriteria: async (data: CreateGradeCriteriaRequest): Promise<{
    success: boolean;
    data: GradeCriteria;
    error?: string;
  }> => {
    const response = await apiClient.post('/grading/criteria', data);
    return response.data;
  },

  updateCriteria: async (id: string, data: UpdateGradeCriteriaRequest): Promise<{
    success: boolean;
    data: GradeCriteria;
    error?: string;
  }> => {
    const response = await apiClient.put(`/grading/criteria/${id}`, data);
    return response.data;
  },

  deleteCriteria: async (id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/grading/criteria/${id}`);
    return response.data;
  },

  createWeight: async (data: CreateGradeWeightRequest): Promise<{
    success: boolean;
    data: GradeWeight;
    error?: string;
  }> => {
    const response = await apiClient.post('/grading/weights', data);
    return response.data;
  },

  updateWeight: async (id: string, data: UpdateGradeWeightRequest): Promise<{
    success: boolean;
    data: GradeWeight;
    error?: string;
  }> => {
    const response = await apiClient.put(`/grading/weights/${id}`, data);
    return response.data;
  },

  deleteWeight: async (id: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => {
    const response = await apiClient.delete(`/grading/weights/${id}`);
    return response.data;
  },

  calculateStudentGrade: async (courseId: string, studentId: string): Promise<{
    success: boolean;
    data: StudentGrade | null;
    error?: string;
  }> => {
    const response = await apiClient.get(`/grading/courses/${courseId}/students/${studentId}/grade`);
    return response.data;
  },

  getStudentGradeReport: async (courseId: string, studentId?: string): Promise<{
    success: boolean;
    data: StudentGradeReport;
    error?: string;
  }> => {
    const studentIdParam = studentId || 'me';
    const response = await apiClient.get(`/grading/courses/${courseId}/students/${studentIdParam}/report`);
    return response.data;
  },

  // Grading Tasks API
  getGradingTasks: async (): Promise<{
    success: boolean;
    data?: GradingTask[];
    error?: string;
  }> => {
    const response = await apiClient.get('/grading/tasks');
    return response.data;
  },

  updateGradingTask: async (taskId: string, data: {
    teacherScore: number;
    teacherFeedback: string;
  }): Promise<{
    success: boolean;
    data?: GradingTask;
    error?: string;
  }> => {
    const response = await apiClient.patch(`/grading/tasks/${taskId}`, data);
    return response.data;
  },

  generateAIFeedback: async (data: {
    question: string;
    answer: string;
    maxScore?: number;
  }): Promise<{
    success: boolean;
    data?: {
      score: number;
      feedback: string;
    };
    error?: string;
  }> => {
    const response = await apiClient.post('/grading/ai/feedback', data);
    return response.data;
  },
};

