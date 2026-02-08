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
      label: 'Pending',
      value: summary?.pending.toString() || '0',
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

  const normalizeStatus = (value?: string) => {
    const normalized = (value || '').toLowerCase().replace('-', '_');
    return normalized || 'todo';
  };

  const activeTasks = tasks.filter((t) => normalizeStatus(t.status) !== 'done' && !t.completed);

  const mapToUiTask = (apiTask: Task): any => ({
    ...apiTask,
    id: apiTask.id.toString(),
    status: normalizeStatus(apiTask.status || (apiTask.completed ? 'done' : 'todo')),
    assignee: apiTask.assigned_to ? `User ${apiTask.assigned_to}` : undefined,
    dueDate: apiTask.due_date ? new Date(apiTask.due_date).toLocaleDateString() : undefined,
  });

  const inProgressTasks = activeTasks
    .filter((t) => normalizeStatus(t.status) === 'in_progress')
    .map(mapToUiTask);
  const todoTasks = activeTasks
    .filter((t) => normalizeStatus(t.status) === 'todo')
    .map(mapToUiTask);
  const highPriorityTasks = activeTasks
    .filter(t => t.priority === 'high')
    .map(mapToUiTask);

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
          <h2>In Progress</h2>
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
          <h2>To Do</h2>
          <div className={styles.taskList}>
            {todoTasks.length > 0 ? (
              todoTasks.slice(0, 5).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <p className={styles.empty}>No tasks to do</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tasksSection} style={{ marginTop: '2rem' }}>
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
