import apiClient from './client';

export interface MLTrainingStats {
  totalSamples: number;
  samplesWithAI: number;
  samplesWithTeacher: number;
  samplesUsedForTraining: number;
  lastTrainingDate: string | null;
  lastTrainingAccuracy: number | null;
  lastTrainingMSE: number | null;
  lastTrainingMAE: number | null;
}

export interface MLTrainingSettings {
  aiWeight: number;
  teacherWeight: number;
}

export interface MLTrainingHistory {
  id: string;
  accuracy: number | null;
  mse: number | null;
  mae: number | null;
  samples: number;
  aiWeight: number;
  teacherWeight: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface MLTrainingResult {
  accuracy?: number;
  mse?: number;
  mae?: number;
  samples?: number;
}

export const mlTrainingApi = {
  getStats: async (schoolId?: string | null): Promise<{
    success: boolean;
    data?: MLTrainingStats;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.get(`/ml-training/stats${params}`);
    return response.data;
  },

  getSettings: async (schoolId?: string | null): Promise<{
    success: boolean;
    data?: MLTrainingSettings;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.get(`/ml-training/settings${params}`);
    return response.data;
  },

  updateSettings: async (
    data: MLTrainingSettings,
    schoolId?: string | null
  ): Promise<{
    success: boolean;
    data?: MLTrainingSettings;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.put(`/ml-training/settings${params}`, data);
    return response.data;
  },

  train: async (schoolId?: string | null): Promise<{
    success: boolean;
    data?: MLTrainingResult;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.post(`/ml-training/train${params}`);
    return response.data;
  },

  getHistory: async (
    schoolId?: string | null,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data?: MLTrainingHistory[];
    error?: string;
  }> => {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    params.append('limit', limit.toString());
    const response = await apiClient.get(`/ml-training/history?${params.toString()}`);
    return response.data;
  },
};
