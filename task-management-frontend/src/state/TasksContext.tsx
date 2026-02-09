import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { createTask, deleteTask, getTask, getTasks, updateTask } from '../api/tasks';
import { Task, TaskCreateRequest, TaskUpdateRequest, TasksState } from '../types';

type TasksAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: TasksState['filters'] };

const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    search: '',
  },
};

const tasksReducer = (state: TasksState, action: TasksAction): TasksState => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    default:
      return state;
  }
};

interface TasksContextValue extends TasksState {
  refreshTasks: (force?: boolean) => Promise<void>;
  refreshTask: (id: number) => Promise<void>;
  setFilters: (filters: TasksState['filters']) => void;
  create: (data: TaskCreateRequest) => Promise<Task | null>;
  update: (id: number, data: TaskUpdateRequest) => Promise<Task | null>;
  remove: (id: number) => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const lastFetchRef = useRef<number>(0);

  const refreshTasks = useCallback(
    async (force = false) => {
      if (!force && Date.now() - lastFetchRef.current < 25_000) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      try {
        const response = await getTasks(state.filters);
        dispatch({ type: 'SET_TASKS', payload: response });
        lastFetchRef.current = Date.now();
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Unable to load tasks right now.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.filters]
  );

  const refreshTask = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await getTask(id);
      dispatch({ type: 'SET_CURRENT_TASK', payload: response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to load task details.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const setFilters = useCallback((filters: TasksState['filters']) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const create = useCallback(async (data: TaskCreateRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await createTask(data);
      await refreshTasks(true);
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to create the task.' });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [refreshTasks]);

  const update = useCallback(async (id: number, data: TaskUpdateRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await updateTask(id, data);
      await refreshTasks(true);
      dispatch({ type: 'SET_CURRENT_TASK', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to update the task.' });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [refreshTasks]);

  const remove = useCallback(async (id: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await deleteTask(id);
      await refreshTasks(true);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Unable to delete the task.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [refreshTasks]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const value = useMemo(
    () => ({
      ...state,
      refreshTasks,
      refreshTask,
      setFilters,
      create,
      update,
      remove,
    }),
    [state, refreshTasks, refreshTask, setFilters, create, update, remove]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
