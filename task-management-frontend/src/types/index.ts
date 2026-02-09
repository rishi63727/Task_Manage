export interface User {
  id: number;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  due_date?: string;
  assigned_to?: number;
  created_by: number;
  completed_at?: string;
}

export interface Comment {
  id: number;
  content: string;
  task_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  task_id: number;
  uploaded_by: number;
  uploaded_at: string;
}

export interface Analytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  tasks_by_priority: { [key: string]: number };
  tasks_by_status: { [key: string]: number };
  completion_trend: { date: string; completed: number }[];
  average_completion_time: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
    search?: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: number;
}

export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface CommentCreateRequest {
  content: string;
  task_id: number;
}

export interface FileUploadRequest {
  file: File;
  task_id: number;
}
