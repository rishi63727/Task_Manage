import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { analyticsAPI, exportsAPI } from '../api'
import type { TaskSummary, UserPerformance, TaskTrends } from '../types'

export function Analytics() {
  const [summary, setSummary] = useState<TaskSummary | null>(null)
  const [performance, setPerformance] = useState<UserPerformance[]>([])
  const [trends, setTrends] = useState<TaskTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendDays, setTrendDays] = useState(30)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      analyticsAPI.getTaskSummary(),
      analyticsAPI.getUserPerformance(),
      analyticsAPI.getTaskTrends(trendDays),
    ])
      .then(([s, p, t]) => {
        if (!cancelled) {
          setSummary(s)
          setPerformance(p)
          setTrends(t)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [trendDays])

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      await exportsAPI.downloadExport({ format, limit: 1000 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading && !summary) return <Layout><LoadingSpinner /></Layout>

  const priorityData = summary
    ? Object.entries(summary.by_priority).map(([name, value]) => ({ name, count: value }))
    : []
  const statusData = summary
    ? Object.entries(summary.by_status).map(([name, value]) => ({ name: name.replace('_', ' '), count: value }))
    : []
  const trendData = trends?.daily_trends?.map((d) => ({
    date: d.date,
    created: d.tasks_created,
    completed: d.tasks_completed,
  })) ?? []

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Analytics & Reports</h2>
        <div>
          <button type="button" className="btn btn-secondary" disabled={exporting} onClick={() => handleExport('csv')} style={{ marginRight: '0.5rem' }}>
            Export CSV
          </button>
          <button type="button" className="btn btn-secondary" disabled={exporting} onClick={() => handleExport('json')}>
            Export JSON
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}

      {summary && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">Task summary</div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div><strong>Total</strong> {summary.total}</div>
                <div><strong>Completed</strong> {summary.completed}</div>
                <div><strong>Pending</strong> {summary.pending}</div>
                <div><strong>Overdue</strong> {summary.overdue}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.75rem' }}>By priority</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={priorityData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--accent)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.75rem' }}>By status</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={statusData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--success)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">Task trends</div>
            <div className="card-body">
              <div style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="trend-days">Days </label>
                <select
                  id="trend-days"
                  className="form-select"
                  style={{ width: 'auto', display: 'inline-block', marginLeft: '0.5rem' }}
                  value={trendDays}
                  onChange={(e) => setTrendDays(Number(e.target.value))}
                >
                  <option value={7}>7</option>
                  <option value={14}>14</option>
                  <option value={30}>30</option>
                  <option value={90}>90</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" stroke="var(--accent)" name="Created" />
                  <Line type="monotone" dataKey="completed" stroke="var(--success)" name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">User performance</div>
            <div className="card-body">
              {performance.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No performance data yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>Email</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>Assigned</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>Completed</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>Rate %</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>Avg hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.map((p) => (
                        <tr key={p.user_id}>
                          <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>{p.email}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>{p.tasks_assigned}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>{p.tasks_completed}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>{p.completion_rate.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                            {p.avg_completion_time_hours != null ? `${p.avg_completion_time_hours.toFixed(1)}h` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
