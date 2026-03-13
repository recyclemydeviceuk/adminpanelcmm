import api from './api';

export interface UploadImageResponse {
  imageUrl: string;
  key: string;
}

export const uploadApi = {
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ imageUrl: string; key: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async uploadMultipleImages(files: File[]) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post<{ images: Array<{ imageUrl: string; key: string }> }>('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteImage(imageUrl: string) {
    return api.delete('/upload/image', { data: { imageUrl } });
  },

  async getPresignedUrl(fileName: string, fileType: string) {
    return api.post<{ presignedUrl: string; key: string; publicUrl: string }>('/upload/presigned-url', {
      fileName,
      fileType,
    });
  },
};

export default uploadApi;
