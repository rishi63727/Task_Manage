export interface User {
  id: number
  email: string
}

/**
 * Task from API. Completion is derived from status on the backend:
 * status === 'done' ⟺ completed === true and completed_at set.
 * In the frontend, always use status for "is done?" logic (see utils/taskStatus).
 */
export interface Task {
  id: number
  title: string
  description: string | null
  /** Derived from status on backend; do not use for UI logic — use task.status === 'done' */
  completed: boolean
  priority: string
  status: string
  due_date: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
  /** Set when status becomes 'done'; do not use for filtering — use status */
  completed_at: string | null
  owner_id: number
  assigned_to: number | null
}

export interface TaskCreate {
  title: string
  description?: string | null
  priority?: string
  status?: string
  due_date?: string | null
  tags?: string[] | null
  assigned_to?: number | null
}

export interface TaskUpdate extends Partial<TaskCreate> {}

export interface Comment {
  id: number
  content: string
  task_id: number
  user_id: number
  created_at: string
  updated_at: string
}

export interface FileRecord {
  id: number
  filename: string
  filepath: string
  size: number
  content_type: string
  task_id: number
  uploaded_by: number
  created_at: string
}

export interface TaskSummary {
  total: number
  completed: number
  pending: number
  overdue: number
  by_priority: Record<string, number>
  by_status: Record<string, number>
}

export interface UserPerformance {
  user_id: number
  email: string
  tasks_assigned: number
  tasks_completed: number
  completion_rate: number
  avg_completion_time_hours: number | null
}

export interface DailyTrend {
  date: string
  tasks_created: number
  tasks_completed: number
}

export interface TaskTrends {
  daily_trends: DailyTrend[]
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}
