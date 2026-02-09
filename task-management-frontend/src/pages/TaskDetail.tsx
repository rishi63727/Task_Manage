import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FileUpload } from '../components/FileUpload'
import { commentsAPI, filesAPI, tasksAPI } from '../api'
import { useUsers } from '../context/UsersContext'
import { getTaskStatus, formatStatusLabel, TASK_STATUS } from '../utils/taskStatus'
import type { Task, Comment, FileRecord } from '../types'

/**
 * Task state is only ever set from (1) load() response or (2) update API response.
 * We never sync from a parent prop (e.g. useEffect([task]) setTask(task)) so that
 * when we update status, the UI stays correct and doesn't roll back to stale parent data.
 */
export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getUserEmail } = useUsers()
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const taskId = id ? parseInt(id, 10) : NaN

  const load = useCallback(() => {
    if (!taskId || isNaN(taskId)) return
    setLoading(true)
    setError(null)
    Promise.all([
      tasksAPI.getTask(taskId),
      commentsAPI.getTaskComments(taskId),
      filesAPI.getTaskFiles(taskId),
    ])
      .then(([t, c, f]) => {
        setTask(t)
        setComments(c)
        setFiles(f)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isNaN(taskId)) return
    setSubmittingComment(true)
    try {
      const c = await commentsAPI.createComment(taskId, commentText.trim())
      setComments((prev) => [c, ...prev])
      setCommentText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleUploadFile = async (file: File) => {
    const f = await filesAPI.uploadTaskFile(taskId, file)
    setFiles((prev) => [f, ...prev])
  }

  const handleDeleteFile = async (fileId: number) => {
    try {
      await filesAPI.deleteFile(fileId)
      setFiles((prev) => prev.filter((x) => x.id !== fileId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  const handleDeleteTask = async () => {
    try {
      await tasksAPI.deleteTask(taskId)
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setDeleteConfirm(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!task || newStatus === getTaskStatus(task)) return
    setUpdatingStatus(true)
    setError(null)
    try {
      const updated = await tasksAPI.updateTask(taskId, { status: newStatus })
      setTask(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading && !task) return <Layout><LoadingSpinner /></Layout>
  if (error && !task) return <Layout><p className="form-error">{error}</p></Layout>
  if (!task) return <Layout><p>Task not found.</p></Layout>

  const status = getTaskStatus(task)
  const priority = task.priority ?? 'medium'

  return (
    <Layout>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tasks" style={{ fontSize: '0.875rem' }}>← Back to tasks</Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>{task.title}</span>
          <div>
            <Link to={`/tasks/${task.id}/edit`} className="btn btn-secondary" style={{ marginRight: '0.5rem' }}>
              Edit
            </Link>
            <button type="button" className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
              Delete
            </button>
          </div>
        </div>
        <div className="card-body">
          <p style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge badge-${status === TASK_STATUS.DONE ? 'done' : status === TASK_STATUS.IN_PROGRESS ? 'in_progress' : 'todo'}`}>
              {formatStatusLabel(status)}
            </span>
            <select
              className="form-select"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              style={{ width: 'auto', minWidth: 120 }}
              aria-label="Change status"
            >
              <option value={TASK_STATUS.TODO}>Todo</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In progress</option>
              <option value={TASK_STATUS.DONE}>Done</option>
            </select>
            <span className={`badge badge-${priority}`}>{priority}</span>
          </p>
          {task.description && <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 0.5rem' }}>{task.description}</p>}
          {task.due_date && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Due: {new Date(task.due_date).toLocaleString()}
            </p>
          )}
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Assigned to: <span style={{ fontWeight: 500 }}>{getUserEmail(task.assigned_to)}</span>
          </p>
          {task.tags && task.tags.length > 0 && (
            <p style={{ marginTop: '0.5rem' }}>
              {task.tags.map((tag) => (
                <span key={tag} className="badge badge-low" style={{ marginRight: '0.25rem' }}>{tag}</span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">Files</div>
        <div className="card-body">
          <FileUpload onUpload={handleUploadFile} />
          {files.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '1rem 0 0', padding: 0 }}>
              {files.map((f) => (
                <li key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ textAlign: 'left', flex: 1 }}
                    onClick={() => filesAPI.downloadFile(f.id, f.filename)}
                  >
                    {f.filename}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => handleDeleteFile(f.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Comments</div>
        <div className="card-body">
          <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
            <textarea
              className="form-textarea"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
            />
            <button type="submit" className="btn btn-primary" disabled={!commentText.trim() || submittingComment}>
              {submittingComment ? 'Sending…' : 'Add comment'}
            </button>
          </form>
          {comments.length === 0 && <p style={{ color: 'var(--text-muted)', margin: 0 }}>No comments yet.</p>}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {comments.map((c) => (
              <li key={c.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div className="comment-markdown">
                  <ReactMarkdown>{c.content}</ReactMarkdown>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteConfirm(false)}
      />
    </Layout>
  )
}
