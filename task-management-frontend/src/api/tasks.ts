import api from './client';

export interface TaskFilters {
  q?: string;
  completed?: boolean;
  priority?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: string;
  [key: string]: any;
}

export const getTasks = (params: TaskFilters = {}) =>
  api.get('/api/v1/tasks/', { params }).then((r) => r.data);

export const getTask = (id: string) =>
  api.get(`/api/v1/tasks/${id}`).then((r) => r.data);

export const createTask = (data: any) =>
  api.post('/api/v1/tasks/', data).then((r) => r.data);

export const updateTask = (id: string, data: any) =>
  api.put(`/api/v1/tasks/${id}`, data).then((r) => r.data);

export const deleteTask = (id: string) =>
  api.delete(`/api/v1/tasks/${id}`);

export const createBulkTasks = (tasks: any[]) =>
  api.post('/api/v1/tasks/bulk', { tasks }).then((r) => r.data);
