import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { tasksAPI } from '../api'
import { TASK_STATUS, formatStatusLabel } from '../utils/taskStatus'
import type { TaskCreate } from '../types'

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]

type Row = { title: string; priority: string; status: string }

const defaultRow: Row = { title: '', priority: 'medium', status: TASK_STATUS.TODO }

export function BulkCreateTasks() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Row[]>([{ ...defaultRow }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addRow = () => setRows((r) => [...r, { ...defaultRow }])
  const removeRow = (index: number) => {
    if (rows.length <= 1) return
    setRows((r) => r.filter((_, i) => i !== index))
  }
  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const withTitle = rows.filter((r) => r.title.trim())
    if (withTitle.length === 0) {
      setError('Add at least one task with a title.')
      return
    }
    const tasks: TaskCreate[] = withTitle.map((r) => ({
      title: r.title.trim(),
      priority: r.priority || 'medium',
      status: r.status || TASK_STATUS.TODO,
    }))
    setSaving(true)
    try {
      const res = await tasksAPI.createBulkTasks(tasks)
      navigate('/tasks', { replace: true, state: { bulkCreated: res.created } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tasks">← Back to tasks</Link>
      </div>
      <div className="card">
        <div className="card-header">Bulk create tasks</div>
        <div className="card-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
            Add multiple tasks at once. Each row needs at least a title. Empty rows are skipped.
          </p>
          <form onSubmit={handleSubmit}>
            {error && <p className="form-error">{error}</p>}
            <div style={{ marginBottom: '1rem' }}>
              {rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '0.5rem',
                    alignItems: 'end',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor={`bulk-title-${i}`}>Title</label>
                    <input
                      id={`bulk-title-${i}`}
                      type="text"
                      className="form-input"
                      placeholder="Task title"
                      value={row.title}
                      onChange={(e) => updateRow(i, 'title', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, minWidth: '100px' }}>
                    <label htmlFor={`bulk-priority-${i}`}>Priority</label>
                    <select
                      id={`bulk-priority-${i}`}
                      className="form-select"
                      value={row.priority}
                      onChange={(e) => updateRow(i, 'priority', e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, minWidth: '120px' }}>
                    <label htmlFor={`bulk-status-${i}`}>Status</label>
                    <select
                      id={`bulk-status-${i}`}
                      className="form-select"
                      value={row.status}
                      onChange={(e) => updateRow(i, 'status', e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{formatStatusLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    title="Remove row"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={addRow}>
                Add row
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create all'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
