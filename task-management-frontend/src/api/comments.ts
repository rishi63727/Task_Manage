import api from './client';

export const getTaskComments = (taskId: string, params: any = {}) =>
  api.get(`/api/v1/tasks/${taskId}/comments`, { params }).then((r) => r.data);

export const createComment = (taskId: string, content: string) =>
  api.post(`/api/v1/tasks/${taskId}/comments`, { content }).then((r) => r.data);

export const updateComment = (commentId: string, content: string) =>
  api.put(`/api/v1/comments/${commentId}`, { content }).then((r) => r.data);

export const deleteComment = (commentId: string) =>
  api.delete(`/api/v1/comments/${commentId}`);
