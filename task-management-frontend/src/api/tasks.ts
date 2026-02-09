import { request } from './client'
import type { Task, TaskCreate, TaskUpdate } from '../types'

export interface TaskListParams {
  q?: string
  priority?: string
  status?: string
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: string
}

export interface BulkTaskResponse {
  created: number
  tasks: Task[]
}

export const tasksAPI = {
  getTasks(params: TaskListParams = {}): Promise<Task[]> {
    const sp = new URLSearchParams()
    if (params.q) sp.set('q', params.q)
    if (params.priority) sp.set('priority', params.priority)
    if (params.status) sp.set('status', params.status)
    if (params.limit != null) sp.set('limit', String(params.limit))
    if (params.offset != null) sp.set('offset', String(params.offset))
    if (params.sort_by) sp.set('sort_by', params.sort_by)
    if (params.sort_order) sp.set('sort_order', params.sort_order)
    const query = sp.toString()
    return request<Task[]>(`/api/v1/tasks${query ? `?${query}` : ''}`)
  },

  getTask(id: number): Promise<Task> {
    return request<Task>(`/api/v1/tasks/${id}`)
  },

  createTask(data: TaskCreate): Promise<Task> {
    return request<Task>('/api/v1/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateTask(id: number, data: TaskUpdate): Promise<Task> {
    return request<Task>(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteTask(id: number): Promise<void> {
    return request<void>(`/api/v1/tasks/${id}`, { method: 'DELETE' })
  },

  createBulkTasks(tasks: TaskCreate[]): Promise<BulkTaskResponse> {
    return request<BulkTaskResponse>('/api/v1/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    })
  },
}
