import React from 'react';
import { TasksState } from '../types';

interface TaskFiltersProps {
  filters: TasksState['filters'];
  onChange: (filters: TasksState['filters']) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onChange }) => (
  <div className="filters">
    <div className="field">
      <label>Status</label>
      <select
        value={filters.status || ''}
        onChange={(event) => onChange({ ...filters, status: event.target.value })}
      >
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
    <div className="field">
      <label>Priority</label>
      <select
        value={filters.priority || ''}
        onChange={(event) => onChange({ ...filters, priority: event.target.value })}
      >
        <option value="">All</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </div>
    <div className="field">
      <label>Search</label>
      <input
        type="search"
        placeholder="Search tasks"
        value={filters.search || ''}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
      />
    </div>
  </div>
);

export default TaskFilters;
