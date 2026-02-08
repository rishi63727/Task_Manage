import api from './client';

export const getTaskSummary = () =>
  api.get('/api/v1/analytics/summary').then((r) => r.data);

export const getUserPerformance = () =>
  api.get('/api/v1/analytics/users/performance').then((r) => r.data);

export const getTaskTrends = (days: number = 30) =>
  api.get('/api/v1/analytics/tasks/trends', { params: { days } }).then((r) => r.data);
