import { useEffect, useState } from 'react';
import { getTaskSummary, getUserPerformance, getTaskTrends } from '../api/analytics';
import { exportTasks } from '../api/exports';
import TaskDistributionChart from '../components/TaskDistributionChart';
import PriorityChart from '../components/PriorityChart';
import TrendChart from '../components/TrendChart';
import type { AnalyticsSummary, UserPerformance, TaskTrends } from '../api/types';
import styles from './AnalyticsPage.module.css';

function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [performance, setPerformance] = useState<UserPerformance[]>([]);
  const [trends, setTrends] = useState<TaskTrends | null>(null);
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryData, perfData, trendsData] = await Promise.all([
          getTaskSummary(),
          getUserPerformance(),
          getTaskTrends(trendDays),
        ]);
        setSummary(summaryData);
        setPerformance(Array.isArray(perfData) ? perfData : []);
        setTrends(trendsData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trendDays]);

  if (loading) {
    return (
      <div className={styles.analytics}>
        <h1>Analytics & Reports</h1>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <h1>Analytics & Reports</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  const completionRate =
    summary && summary.total > 0
      ? ((summary.completed / summary.total) * 100).toFixed(1)
      : '0';

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(format);
    try {
      const blob = await exportTasks({ format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className={styles.analytics}>
      <div className={styles.pageHeader}>
        <h1>Analytics & Reports</h1>
        <div className={styles.exportButtons}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => handleExport('csv')}
            disabled={!!exporting}
          >
            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => handleExport('json')}
            disabled={!!exporting}
          >
            {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>Total Tasks</h3>
          <p className={styles.metricValue}>{summary?.total ?? 0}</p>
          <p className={styles.metricDesc}>all tasks</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Completion Rate</h3>
          <p className={styles.metricValue}>{completionRate}%</p>
          <p className={styles.metricDesc}>of tasks completed</p>
        </div>
        <div className={styles.metricCard}>
          <h3>To Do</h3>
          <p className={styles.metricValue}>{summary?.pending ?? 0}</p>
          <p className={styles.metricDesc}>pending</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Completed</h3>
          <p className={styles.metricValue}>{summary?.completed ?? 0}</p>
          <p className={styles.metricDesc}>done</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartContainer}>
          <h2>Task distribution</h2>
          <TaskDistributionChart
            completed={summary?.completed ?? 0}
            pending={summary?.pending ?? 0}
          />
        </div>
        <div className={styles.chartContainer}>
          <h2>Tasks by priority</h2>
          <PriorityChart
            byPriority={summary?.by_priority ?? { low: 0, medium: 0, high: 0 }}
          />
        </div>
      </div>

      <div className={styles.chartContainer} style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h2>Task trends</h2>
          <select
            value={trendDays}
            onChange={(e) => setTrendDays(Number(e.target.value))}
            className={styles.trendSelect}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
        {trends?.daily_trends?.length ? (
          <TrendChart dailyTrends={trends.daily_trends} />
        ) : (
          <p className={styles.emptyTrends}>No trend data for this period.</p>
        )}
      </div>

      {performance.length > 0 && (
        <div className={styles.chartContainer} style={{ marginTop: '2rem' }}>
          <h2>User performance</h2>
          <table className={styles.performanceTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>Completion rate</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p) => (
                <tr key={p.user_id}>
                  <td>{p.email}</td>
                  <td>{p.tasks_assigned}</td>
                  <td>{p.tasks_completed}</td>
                  <td>{p.completion_rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
