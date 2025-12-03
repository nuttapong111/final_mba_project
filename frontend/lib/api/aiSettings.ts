import apiClient from './client';

export type AIProvider = 'GEMINI' | 'ML' | 'BOTH';

export interface AISettings {
  id: string;
  schoolId: string | null;
  provider: AIProvider;
  mlApiUrl?: string;
  enabled: boolean;
  hasGeminiKey: boolean;
}

export const aiSettingsApi = {
  getSettings: async (schoolId?: string | null): Promise<{
    success: boolean;
    data?: AISettings;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.get(`/ai-settings${params}`);
    return response.data;
  },

  updateSettings: async (data: {
    provider: AIProvider;
    mlApiUrl?: string;
    geminiApiKey?: string;
    enabled: boolean;
  }, schoolId?: string | null): Promise<{
    success: boolean;
    data?: AISettings;
    error?: string;
  }> => {
    const params = schoolId ? `?schoolId=${schoolId}` : '';
    const response = await apiClient.put(`/ai-settings${params}`, data);
    return response.data;
  },
};

