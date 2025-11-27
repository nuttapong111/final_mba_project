import apiClient from './client';

export interface UploadFileResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
  error?: string;
}

export const uploadApi = {
  uploadFile: async (file: File, type: 'video' | 'document'): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  uploadMultipleFiles: async (files: File[], type: 'video' | 'document'): Promise<{
    success: boolean;
    data: Array<{
      url: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }>;
    error?: string;
  }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('type', type);

    const response = await apiClient.post('/upload/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

