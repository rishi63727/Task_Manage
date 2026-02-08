import api from './client';

export interface FileUploadData {
  file: File;
  taskId?: string;
  [key: string]: any;
}

export const getFiles = (params: any = {}) =>
  api.get('/api/v1/files', { params }).then((r) => r.data);

export const getFile = (id: string) =>
  api.get(`/api/v1/files/${id}`).then((r) => r.data);

export const uploadFile = (taskId: string, data: FormData) =>
  api.post(`/api/v1/tasks/${taskId}/files`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deleteFile = (id: string) =>
  api.delete(`/api/v1/files/${id}`);

export const getTaskFiles = (taskId: string) =>
  api.get(`/api/v1/tasks/${taskId}/files`).then((r) => r.data);
