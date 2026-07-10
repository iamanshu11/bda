import { api } from './api';

/**
 * Upload a file to the backend and return its public URL.
 * Used by admin forms for banners, photos and gallery images.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url as string;
}
