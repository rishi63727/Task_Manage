import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { EmptyState } from '../components/EmptyState'
import { tasksAPI } from '../api'
import { useUsers } from '../context/UsersContext'
import { connectSocket, disconnectSocket } from '../services/socket'
import { getTaskStatus, formatStatusLabel, TASK_STATUS } from '../utils/taskStatus'
import type { Task } from '../types'

const STATUS_OPTIONS = ['', TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high']

export function TaskList() {
  const { getUserEmail } = useUsers()
  const location = useLocation()
  const bulkCreated = (location.state as { bulkCreated?: number } | null)?.bulkCreated
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchTasks = useCallback(() => {
    setLoading(true)
    setError(null)
    tasksAPI
      .getTasks({
        q: q || undefined,
        status: status || undefined,
        priority: priority || undefined,
        limit: 50,
        offset: 0,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then(setTasks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [q, status, priority, sortBy, sortOrder])

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300)
    return () => clearTimeout(t)
  }, [fetchTasks])

  useEffect(() => {
    connectSocket((event) => {
      switch (event.type) {
        case 'TASK_CREATED':
        case 'TASK_UPDATED':
        case 'TASK_DELETED':
          fetchTasks()
          break
      }
    })
    return () => disconnectSocket()
  }, [fetchTasks])

  const statusBadge = (task: Task) => {
    const s = getTaskStatus(task)
    return (
      <span key={s} className={`badge badge-${s === TASK_STATUS.DONE ? 'done' : s === TASK_STATUS.IN_PROGRESS ? 'in_progress' : 'todo'}`}>
        {formatStatusLabel(s)}
      </span>
    )
  }
  const priorityBadge = (p: string | undefined) => {
    const priority = p ?? 'medium'
    return (
      <span key={priority} className={`badge badge-${priority}`}>{priority}</span>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Tasks</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/tasks/new" className="btn btn-primary">
            New task
          </Link>
          <Link to="/tasks/bulk" className="btn btn-secondary">
            Bulk create
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="task-search">Search</label>
              <input
                id="task-search"
                type="search"
                className="form-input"
                placeholder="Title or description"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="task-status">Status</label>
              <select id="task-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{formatStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All</option>
                {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="task-sort">Sort by</label>
              <select id="task-sort" className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="created_at">Created</option>
                <option value="updated_at">Updated</option>
                <option value="due_date">Due date</option>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="task-order">Order</label>
              <select id="task-order" className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {bulkCreated != null && (
        <p style={{ padding: '0.75rem 1rem', background: 'var(--success)', color: '#000', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
          Created {bulkCreated} task{bulkCreated !== 1 ? 's' : ''} successfully.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
      {loading && <LoadingSpinner />}
      {!loading && !error && tasks.length === 0 && (
        <div className="card">
          <EmptyState
            title="No tasks found"
            description="Create a task or adjust filters."
            action={<Link to="/tasks/new" className="btn btn-primary">New task</Link>}
          />
        </div>
      )}
      {!loading && !error && tasks.length > 0 && (
        <div className="card">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '1rem 1.25rem',
                }}
              >
                <Link to={`/tasks/${task.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                        </p>
                      )}
                      <div style={{ marginTop: '0.5rem' }}>
                        {statusBadge(task)}
                        {priorityBadge(task.priority)}
                        {task.due_date && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Assigned to: <span style={{ fontWeight: 500 }}>{getUserEmail(task.assigned_to)}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-${getTaskStatus(task) === TASK_STATUS.DONE ? 'done' : getTaskStatus(task) === TASK_STATUS.IN_PROGRESS ? 'in_progress' : 'todo'}`}>
                      {formatStatusLabel(getTaskStatus(task))}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  )
}
