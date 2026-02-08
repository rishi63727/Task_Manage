import styles from './TaskCard.module.css'
import MarkdownRenderer from './MarkdownRenderer'

export interface TaskCardTask {
  id: number | string
  title: string
  description?: string | null
  priority: string
  completed?: boolean
  status?: string
  assignee?: string
  dueDate?: string
  created_at?: string
}

interface TaskCardProps {
  task: TaskCardTask
  onClick?: () => void
}

const priorityColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#991b1b',
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const statusLabel = task.completed === true
    ? 'Done'
    : task.status === 'backlog'
      ? 'Backlog'
      : task.status === 'todo'
        ? 'To Do'
        : task.status === 'in-progress'
          ? 'In Progress'
          : task.status === 'review'
            ? 'Review'
            : task.status === 'done'
              ? 'Done'
              : 'To Do'

  return (
    <div className={styles.card} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div className={styles.header}>
        <h3 className={styles.title}>{task.title}</h3>
        <span
          className={styles.priority}
          style={{ backgroundColor: priorityColors[task.priority] ?? '#6b7280' }}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <MarkdownRenderer content={task.description} className={styles.description} />
      )}

      <div className={styles.footer}>
        <span className={styles.status}>{statusLabel}</span>
        {task.assignee && (
          <span className={styles.assignee}>Assigned to {task.assignee}</span>
        )}
      </div>

      {task.dueDate && (
        <div className={styles.dueDate}>Due: {task.dueDate}</div>
      )}
    </div>
  )
}

export default TaskCard
