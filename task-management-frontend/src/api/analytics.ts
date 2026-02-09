import { request } from './client'
import type { TaskSummary, UserPerformance, TaskTrends } from '../types'

export const analyticsAPI = {
  getTaskSummary(): Promise<TaskSummary> {
    return request<TaskSummary>('/api/v1/analytics/tasks/summary')
  },

  getUserPerformance(): Promise<UserPerformance[]> {
    return request<UserPerformance[]>('/api/v1/analytics/users/performance')
  },

  getTaskTrends(days: number = 30): Promise<TaskTrends> {
    return request<TaskTrends>(`/api/v1/analytics/tasks/trends?days=${days}`)
  },
}
