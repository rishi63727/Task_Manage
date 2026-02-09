import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { tasksAPI } from '../api'
import { TASK_STATUS, getTaskStatus, formatStatusLabel } from '../utils/taskStatus'
import type { TaskCreate } from '../types'

const STATUSES = [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]
const PRIORITIES = ['low', 'medium', 'high']

export function TaskForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = id && id !== 'new'
  const taskId = isEdit ? parseInt(id, 10) : NaN

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isEdit || isNaN(taskId)) return
    setLoading(true)
    tasksAPI
      .getTask(taskId)
      .then((t) => {
        setTitle(t.title)
        setDescription(t.description || '')
        setStatus(getTaskStatus(t))
        setPriority(t.priority ?? 'medium')
        setDueDate(t.due_date ? t.due_date.slice(0, 16) : '')
        setTagsStr(t.tags?.join(', ') || '')
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [isEdit, taskId])

  const validate = (): boolean => {
    const err: Record<string, string> = {}
    if (!title.trim()) err.title = 'Title is required'
    setValidationErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    const payload: TaskCreate = {
      title: title.trim(),
      description: description.trim() || null,
      status: status || TASK_STATUS.TODO,
      priority: priority || 'medium',
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      tags: tagsStr ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean) : null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await tasksAPI.updateTask(taskId, payload)
        navigate(`/tasks/${taskId}`, { replace: true })
      } else {
        const created = await tasksAPI.createTask(payload)
        navigate(`/tasks/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner" />
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={isEdit ? `/tasks/${taskId}` : '/tasks'}>← Back</Link>
      </div>
      <div className="card">
        <div className="card-header">{isEdit ? 'Edit task' : 'New task'}</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                className={`form-input ${validationErrors.title ? 'error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
              {validationErrors.title && <p className="form-error">{validationErrors.title}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{formatStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-due">Due date</label>
                <input
                  id="task-due"
                  type="datetime-local"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="task-tags">Tags (comma-separated)</label>
              <input
                id="task-tags"
                className="form-input"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="tag1, tag2"
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update task' : 'Create task'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
