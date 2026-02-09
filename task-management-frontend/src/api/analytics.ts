import api from './base';
import { Analytics } from '../types';

export const getTaskSummary = async (): Promise<Analytics> => {
  const response = await api.get('/api/v1/analytics/tasks/summary');
  return response.data;
};

export const getUserPerformance = async () => {
  const response = await api.get('/api/v1/analytics/users/performance');
  return response.data;
};

export const getTaskTrends = async (days: number = 30) => {
  const response = await api.get('/api/v1/analytics/tasks/trends', { params: { days } });
  return response.data;
};
