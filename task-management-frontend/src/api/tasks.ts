import api from './base';
import { Task, TaskCreateRequest, TaskUpdateRequest, Comment, CommentCreateRequest } from '../types';

export const getTasks = async (params?: { status?: string; priority?: string; search?: string }) => {
  const response = await api.get('/api/v1/tasks', { params });
  return response.data;
};

export const getTask = async (id: number): Promise<Task> => {
  const response = await api.get(`/api/v1/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: TaskCreateRequest): Promise<Task> => {
  const response = await api.post('/api/v1/tasks', data);
  return response.data;
};

export const updateTask = async (id: number, data: TaskUpdateRequest): Promise<Task> => {
  const response = await api.put(`/api/v1/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await api.delete(`/api/v1/tasks/${id}`);
  return response.data;
};

export const getTaskComments = async (taskId: number): Promise<Comment[]> => {
  const response = await api.get(`/api/v1/tasks/${taskId}/comments`);
  return response.data;
};

export const createTaskComment = async (data: CommentCreateRequest): Promise<Comment> => {
  const response = await api.post(`/api/v1/tasks/${data.task_id}/comments`, data);
  return response.data;
};

export const updateTaskComment = async (taskId: number, commentId: number, content: string): Promise<Comment> => {
  const response = await api.put(`/api/v1/tasks/${taskId}/comments/${commentId}`, { content });
  return response.data;
};

export const deleteTaskComment = async (taskId: number, commentId: number) => {
  const response = await api.delete(`/api/v1/tasks/${taskId}/comments/${commentId}`);
  return response.data;
};
