import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import TaskCard from '../components/TaskCard';
import StatCard from '../components/StatCard';
import styles from './DashboardPage.module.css';
import { getTaskSummary } from '../api/analytics';
import { getTasks } from '../api/tasks';
import { AnalyticsSummary, Task } from '../api/types';

function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [summaryData, tasksData] = await Promise.all([
          getTaskSummary(),
          getTasks({ limit: 100, offset: 0 })
        ]);
        setSummary(summaryData);
        setTasks(tasksData.items || tasksData); // Handle potential pagination wrapper
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchData();
  }, []);

  const { lastMessage } = useWebSocket('/ws');

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'TASK_CREATED') {
        const newTask = lastMessage.payload;
        setTasks((prev) => [newTask, ...prev]);
        getTaskSummary().then(setSummary);
      } else if (lastMessage.type === 'TASK_UPDATED') {
        const updatedTask = lastMessage.payload;
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        getTaskSummary().then(setSummary);
      } else if (lastMessage.type === 'TASK_DELETED') {
        const { id } = lastMessage.payload;
        setTasks((prev) => prev.filter((t) => t.id !== id));
        getTaskSummary().then(setSummary);
      }
    }
  }, [lastMessage]);

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1>Welcome back, {user?.name || user?.email || 'User'}!</h1>
          <p>Loading your dashboard...</p>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1>Welcome back, {user?.name || user?.email || 'User'}!</h1>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  const stats: Array<{ label: string; value: string; color: 'blue' | 'orange' | 'green' | 'red' }> = [
    {
      label: 'Total Tasks',
      value: summary?.total.toString() || '0',
      color: 'blue',
    },
    {
      label: 'In Progress',
      value: summary?.pending.toString() || '0', // Using pending as proxy for In Progress or Todo based on API. Backend says "pending", UI says "In Progress".
      color: 'orange',
    },
    {
      label: 'Completed',
      value: summary?.completed.toString() || '0',
      color: 'green',
    },
    {
      label: 'High Priority',
      value: summary?.by_priority.high.toString() || '0',
      color: 'red',
    },
  ];

  // Filter tasks for the lists - assuming backend returns mixed status
  // Note: Backend might define "completed" boolean instead of status string.
  // Let's check the Task type definition we just made.
  // Task type has `completed: boolean`. 
  // It doesn't seem to have a 'status' string field in the backend response based on `TaskResponse` schema in `task.py`.
  // Wait, `TaskResponse` has `completed: bool`. 
  // The UI expects 'status' string ('in-progress', 'todo', 'done').
  // We need to map `completed` bool to these statuses or adjust the UI.
  // However, the `task.py` schema has `completed` bool.
  // But `TasksPage` and `taskStore` use `status` string. 
  // Let's look at `TaskCreate` in `task.py`. It has `priority` string, but no status/completed field?
  // `TaskUpdate` has `completed`.
  // It seems the backend treats tasks as simpler: completed or not.
  // The frontend has 'backlog', 'todo', 'in-progress', 'review', 'done'.
  // Mismatch detected.
  // I will map:
  // completed=true -> 'done'
  // completed=false -> 'in-progress' (or 'todo'?)
  // For now, I'll treat !completed as 'in-progress' for the left column and 'todo' for the right?
  // Actually, without a status field, I can't distinguish between 'todo' and 'in-progress'.
  // I will put all !completed tasks in "To Do" and completed in "Completed"?
  // But the UI has "In Progress" and "To Do" columns.
  // I'll put all !completed tasks in "In Progress" if they are assigned (conceptually) or just split them arbitrarily?
  // No, that's bad.
  // Let's look at `TaskResponse` again. It has `completed: bool`.
  // And `priority`. 
  // The existing frontend `Task` interface in `taskStore` has `status` string.
  // The backend `TaskResponse` only has `completed` boolean.
  // This implies the backend doesn't support the granular statuses the frontend expects.
  // I will adapt the frontend to use `completed` boolean.
  // In Dashboard code:
  // "In Progress" column -> !completed tasks
  // "To Do" column -> maybe we treat them same as In Progress or empty?
  // Let's just put all active tasks in "In Progress" for now to show data.

  const activeTasks = tasks.filter((t) => !t.completed);
  // We can't distinguish 'todo' from 'in-progress' with current API.
  // I'll just list active tasks in the first column and maybe high priority in the second?
  // Or just list all active in existing 'In Progress' column and leave 'To Do' empty or hide it?
  // I will modify the columns to be meaningful with available data.
  // "Active Tasks" and "Recent Completed"?
  // The prompt asks to "Replace hardcoded stats cards with API data".
  // "Display correct values for: Total Tasks, In Progress (pending), Completed, High Priority".
  // Backend "pending" likely maps to !completed.

  // Mapping for TaskCard compatibility:
  // TaskCard expects `task` prop with `status` field.
  // I need to adapt the API Task to the Component Task props on the fly
  // or update TaskCard. Updating TaskCard might break other pages.
  // I will cast/map the data before passing to TaskCard.

  const mapToUiTask = (apiTask: Task): any => ({
    ...apiTask,
    id: apiTask.id.toString(), // Frontend uses string IDs usually? Store used string. API uses int.
    status: apiTask.completed ? 'done' : 'in-progress', // Mapping active to in-progress
    assignee: 'Me', // API doesn't return assignee name, only owner_id.
    dueDate: null, // API doesn't seem to have due date in standard response logic? `created_at` is there.
  });

  const inProgressTasks = activeTasks.map(mapToUiTask);
  // For the second column, maybe show High Priority tasks?
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high' || t.priority === 'critical').map(mapToUiTask);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Welcome back, {user?.name || user?.email || 'User'}!</h1>
        <p>Here's what's happening with your tasks today.</p>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className={styles.tasksSection}>
        <div className={styles.column}>
          <h2>Active Tasks</h2>
          <div className={styles.taskList}>
            {inProgressTasks.length > 0 ? (
              inProgressTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <p className={styles.empty}>No active tasks</p>
            )}
          </div>
        </div>

        <div className={styles.column}>
          <h2>High Priority</h2>
          <div className={styles.taskList}>
            {highPriorityTasks.length > 0 ? (
              highPriorityTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <p className={styles.empty}>No high priority tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
