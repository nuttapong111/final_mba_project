import apiClient from './client';

export interface UploadFileResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key?: string; // S3 key สำหรับลบไฟล์
  };
  error?: string;
}

export const uploadApi = {
  uploadFile: async (
    file: File,
    type: 'video' | 'document',
    onProgress?: (progress: number) => void
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await apiClient.post('/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout (300 seconds)
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('[UPLOAD API] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'ไม่สามารถอัพโหลดไฟล์ได้';
      
      throw new Error(errorMessage);
    }
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

