import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { analyticsAPI } from '../api'
import type { TaskSummary } from '../types'

export function Dashboard() {
  const [summary, setSummary] = useState<TaskSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    analyticsAPI
      .getTaskSummary()
      .then((data) => {
        if (!cancelled) setSummary(data)
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
  }, [])

  return (
    <Layout>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      {loading && <LoadingSpinner />}
      {error && <p className="form-error">{error}</p>}
      {summary && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>{summary.total}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total tasks</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--success)' }}>{summary.completed}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Completed</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{summary.pending}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--error)' }}>{summary.overdue}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Overdue</div>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">Quick actions</div>
        <div className="card-body">
          <Link to="/tasks/new" className="btn btn-primary">
            New task
          </Link>
          <Link to="/tasks" className="btn btn-secondary" style={{ marginLeft: '0.5rem' }}>
            View all tasks
          </Link>
        </div>
      </div>
    </Layout>
  )
}
