import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import TaskCard from '../components/TaskCard';
import { TrendLine } from '../components/Charts';
import { getTaskSummary, getTaskTrends, getUserPerformance } from '../api/analytics';
import { Analytics, Task } from '../types';
import { useTasks } from '../state/TasksContext';
import { formatDuration } from '../utils/format';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { tasks } = useTasks();
  const [summary, setSummary] = useState<Analytics | null>(null);
  const [trend, setTrend] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [performance, setPerformance] = useState<{ completion_rate: number; average_hours: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [summaryData, trendData, performanceData] = await Promise.all([
          getTaskSummary(),
          getTaskTrends(30),
          getUserPerformance(),
        ]);
        if (!isActive) return;
        setSummary(summaryData);
        setTrend({
          labels: trendData.map((item: { date: string }) => item.date),
          values: trendData.map((item: { completed: number }) => item.completed),
        });
        setPerformance({
          completion_rate: performanceData.completion_rate ?? 0,
          average_hours: performanceData.average_completion_hours ?? 0,
        });
      } catch (err) {
        setError('Unable to load dashboard insights.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, []);

  const recentTasks = useMemo(() => tasks.slice(0, 4), [tasks]);

  if (isLoading) return <LoadingState label="Loading overview…" />;
  if (error || !summary) return <ErrorState message={error || 'No summary available.'} />;

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Live pulse on team delivery, trending momentum, and task health."
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            New task
          </button>
        }
      />

      <div className="grid grid-4">
        <StatCard label="Total tasks" value={summary.total_tasks} helper="Active backlog" />
        <StatCard label="Completed" value={summary.completed_tasks} helper="All-time finishes" />
        <StatCard label="In progress" value={summary.in_progress_tasks} helper="Currently owned" />
        <StatCard
          label="Avg completion"
          value={formatDuration(summary.average_completion_time)}
          helper="Time to close"
        />
      </div>

      <div className="grid grid-2">
        <div className="card chart-card">
          <h3>Completion trend</h3>
          <TrendLine labels={trend.labels} data={trend.values} label="Completed" />
        </div>
        <div className="card chart-card">
          <h3>Performance</h3>
          <div className="performance">
            <div>
              <p>Completion rate</p>
              <h2>{Math.round(performance?.completion_rate ?? 0)}%</h2>
            </div>
            <div>
              <p>Avg hours per task</p>
              <h2>{formatDuration(performance?.average_hours ?? 0)}</h2>
            </div>
            <div>
              <p>Tasks touched today</p>
              <h2>{summary.in_progress_tasks + summary.completed_tasks}</h2>
            </div>
          </div>
          <div className="hint">
            Performance metrics update every 5 minutes using the background analytics job.
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent tasks</h2>
          <button className="btn btn-ghost" onClick={() => navigate('/tasks')}>
            View all
          </button>
        </div>
        <div className="grid grid-2">
          {recentTasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
          ))}
          {!recentTasks.length && (
            <div className="card empty-card">
              <h3>No tasks yet</h3>
              <p>Create a task to get the team moving.</p>
              <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
                Create task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
