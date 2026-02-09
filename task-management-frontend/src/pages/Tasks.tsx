import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TaskFilters from '../components/TaskFilters';
import TaskCard from '../components/TaskCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTasks } from '../state/TasksContext';
import { Task } from '../types';

const Tasks: React.FC = () => {
  const { tasks, filters, isLoading, error, setFilters, remove } = useTasks();
  const navigate = useNavigate();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = filters.status ? task.status === filters.status : true;
      const matchesPriority = filters.priority ? task.priority === filters.priority : true;
      const matchesSearch = filters.search
        ? `${task.title} ${task.description}`.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [tasks, filters]);

  return (
    <div className="page">
      <PageHeader
        title="Tasks"
        subtitle="Filter, triage, and keep work moving."
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>
            New task
          </button>
        }
      />

      <TaskFilters filters={filters} onChange={setFilters} />

      {isLoading && <LoadingState label="Fetching tasks…" />}
      {error && <ErrorState message={error} />}
      {!isLoading && !filteredTasks.length && (
        <EmptyState
          title="No tasks match those filters"
          description="Try adjusting status, priority, or search."
          actionLabel="Clear filters"
          onAction={() => setFilters({ status: '', priority: '', search: '' })}
        />
      )}

      <div className="grid grid-2">
        {filteredTasks.map((task) => (
          <div key={task.id} className="task-card-wrap">
            <TaskCard task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
            <div className="task-card-actions">
              <button className="btn btn-ghost" onClick={() => navigate(`/tasks/${task.id}/edit`)}>
                Edit
              </button>
              <button className="btn btn-ghost" onClick={() => setTaskToDelete(task)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            await remove(taskToDelete.id);
            setTaskToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default Tasks;
