import api from './base';
import { File } from '../types';

export const uploadFile = async (taskId: number, file: globalThis.File): Promise<File> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task_id', taskId.toString());

  const response = await api.post('/api/v1/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getTaskFiles = async (taskId: number): Promise<File[]> => {
  const response = await api.get(`/api/v1/tasks/${taskId}/files`);
  return response.data;
};

export const downloadFile = async (fileId: number) => {
  const response = await api.get(`/api/v1/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

export const deleteFile = async (fileId: number) => {
  const response = await api.delete(`/api/v1/files/${fileId}`);
  return response.data;
};
