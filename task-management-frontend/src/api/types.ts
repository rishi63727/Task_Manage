export interface Task {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    priority: string;
    status?: string;
    due_date?: string | null;
    tags?: string[] | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    owner_id: number;
    assigned_to?: number | null;
}

export interface AnalyticsSummary {
    total: number;
    completed: number;
    pending: number;
    by_priority: {
        low: number;
        medium: number;
        high: number;
    };
}

export interface UserPerformance {
    user_id: number;
    email: string;
    tasks_assigned: number;
    tasks_completed: number;
    completion_rate: number;
    avg_completion_time_hours: number | null;
}

export interface DailyTrend {
    date: string;
    tasks_created: number;
    tasks_completed: number;
}

export interface TaskTrends {
    daily_trends: DailyTrend[];
}

export interface Comment {
    id: number;
    content: string;
    task_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    user?: {
        email: string;
    };
}

export interface File {
    id: number;
    filename: string;
    filepath: string;
    content_type: string;
    size: number;
    task_id: number;
    uploaded_by: number;
    created_at: string;
}
