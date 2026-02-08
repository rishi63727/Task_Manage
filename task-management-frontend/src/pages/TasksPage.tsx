'use client';

import React, { useEffect, useState } from 'react';
import { getTasks, createTask } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import BulkCreateModal from '../components/BulkCreateModal';
import type { Task } from '../api/types';
import type { TaskFilters } from '../api/tasks';
import styles from './TasksPage.module.css';

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'done';
    due_date: string;
    tags: string;
    assigned_to: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    tags: '',
    assigned_to: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: TaskFilters = {
        limit,
        offset: (page - 1) * limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const data = await getTasks(params);
      setTasks(Array.isArray(data) ? data : (data as { items?: Task[] }).items ?? []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [page, statusFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSubmitting(true);
    try {
      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : undefined,
      });
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        tags: '',
        assigned_to: '',
      });
      setShowForm(false);
      await loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.tasksPage}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={styles.addButton}
            onClick={() => setShowBulkCreate(true)}
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            Bulk Create
          </button>
          <button
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            + Add Task
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleAddTask} className={styles.form}>
            <input
              type="text"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Task description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'todo' | 'in_progress' | 'done',
                })
              }
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as 'low' | 'medium' | 'high',
                })
              }
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
            <input
              type="number"
              placeholder="Assign to user ID (optional)"
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              min={1}
            />
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSearch} className={styles.searchRow}>
        <input
          type="search"
          placeholder="Search tasks by title or description..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.filterButton}>Search</button>
        {searchQuery && (
          <button type="button" className={styles.filterButton} onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}>
            Clear
          </button>
        )}
      </form>

      <div className={styles.filters}>
        <span className={styles.filterLabel}>Sort:</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
        <button
          type="button"
          className={styles.filterButton}
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </button>
        <span className={styles.filterLabel}>Status:</span>
        {[
          { value: 'all', label: 'All' },
          { value: 'todo', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'done', label: 'Done' },
        ].map((option) => (
          <button
            key={option.value}
            className={`${styles.filterButton} ${statusFilter === option.value ? styles.active : ''
              }`}
            onClick={() => { setStatusFilter(option.value as 'all' | 'todo' | 'in_progress' | 'done'); setPage(1); }}
          >
            {option.label}
          </button>
        ))}
        <span className={styles.filterLabel}>Priority:</span>
        {['all', 'low', 'medium', 'high'].map((p) => (
          <button
            key={p}
            className={`${styles.filterButton} ${priorityFilter === p ? styles.active : ''
              }`}
            onClick={() => { setPriorityFilter(p); setPage(1); }}
          >
            {p === 'all' ? 'All' : p}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading tasks...</p>
      ) : (
        <>
          <div className={styles.tasksList}>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    completed: task.completed,
                    status: task.status,
                    dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined,
                  }}
                  onClick={() => setSelectedTask(task)}
                />
              ))
            ) : (
              <p className={styles.empty}>No tasks found</p>
            )}
          </div>

          <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={styles.filterButton}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={tasks.length < limit}
              onClick={() => setPage(p => p + 1)}
              className={styles.filterButton}
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={loadTasks}
        />
      )}

      {showBulkCreate && (
        <BulkCreateModal
          onClose={() => setShowBulkCreate(false)}
          onSuccess={loadTasks}
        />
      )}
    </div>
  );
}

export default TasksPage;
