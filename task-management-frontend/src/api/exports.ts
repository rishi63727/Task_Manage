import api from './client';

export interface ExportParams {
  format?: 'csv' | 'json';
  completed?: boolean;
  priority?: string;
  limit?: number;
  offset?: number;
}

/** Fetches export as blob and returns it for download. */
export const exportTasks = (params: ExportParams & { format: 'csv' | 'json' }) =>
  api.get('/api/v1/tasks/export', { params, responseType: 'blob' }).then((r) => r.data as Blob);
