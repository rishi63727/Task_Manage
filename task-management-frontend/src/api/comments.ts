import { request } from './client'
import type { Comment } from '../types'

export const commentsAPI = {
  getTaskComments(taskId: number, params?: { limit?: number; offset?: number }): Promise<Comment[]> {
    const sp = new URLSearchParams()
    if (params?.limit != null) sp.set('limit', String(params.limit))
    if (params?.offset != null) sp.set('offset', String(params.offset))
    const query = sp.toString()
    return request<Comment[]>(`/api/v1/tasks/${taskId}/comments${query ? `?${query}` : ''}`)
  },

  createComment(taskId: number, content: string): Promise<Comment> {
    return request<Comment>(`/api/v1/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },

  updateComment(commentId: number, content: string): Promise<Comment> {
    return request<Comment>(`/api/v1/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  },

  deleteComment(commentId: number): Promise<void> {
    return request<void>(`/api/v1/comments/${commentId}`, { method: 'DELETE' })
  },
}
