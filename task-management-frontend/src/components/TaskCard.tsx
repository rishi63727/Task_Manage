import React from 'react';
import { Task } from '../types';
import { formatDate } from '../utils/format';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => (
  <div className={`card task-card status-${task.status}`} onClick={onClick} role="button" tabIndex={0}>
    <div className="task-card-header">
      <h3>{task.title}</h3>
      <span className={`pill priority-${task.priority}`}>{task.priority}</span>
    </div>
    <p className="task-card-desc">{task.description || 'No description yet.'}</p>
    <div className="task-card-meta">
      <span className={`pill status-${task.status}`}>{task.status.replace('_', ' ')}</span>
      <span>Due {formatDate(task.due_date)}</span>
    </div>
  </div>
);

export default React.memo(TaskCard);
