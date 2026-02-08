import { create } from 'zustand'

export interface Task {
  id: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  projectId?: string
  completedAt?: string
}

export interface Project {
  id: string
  name: string
  description: string
  color: string
  members: string[]
  createdAt: string
  updatedAt: string
}

interface TaskState {
  tasks: Task[]
  projects: Project[]
  filteredTasks: Task[]
  selectedProject: string | null
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTask: (id: string) => Task | undefined
  filterTasks: (status?: string, priority?: string) => void
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  setSelectedProject: (projectId: string | null) => void
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design login page',
    description: 'Create a modern and user-friendly login page',
    status: 'done',
    priority: 'high',
    assignee: 'John Doe',
    dueDate: '2024-12-15',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-10',
    completedAt: '2024-12-10',
  },
  {
    id: '2',
    title: 'Setup database',
    description: 'Configure PostgreSQL database and migrations',
    status: 'in-progress',
    priority: 'critical',
    assignee: 'Jane Smith',
    dueDate: '2024-12-20',
    createdAt: '2024-12-02',
    updatedAt: '2024-12-08',
  },
  {
    id: '3',
    title: 'API authentication',
    description: 'Implement JWT token-based authentication',
    status: 'todo',
    priority: 'high',
    assignee: 'Bob Johnson',
    dueDate: '2024-12-25',
    createdAt: '2024-12-03',
    updatedAt: '2024-12-03',
  },
  {
    id: '4',
    title: 'Create dashboard mockups',
    description: 'Design dashboard UI in Figma',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-12-22',
    createdAt: '2024-12-04',
    updatedAt: '2024-12-04',
  },
]

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of company website',
    color: '#3b82f6',
    members: ['John Doe', 'Jane Smith'],
    createdAt: '2024-11-01',
    updatedAt: '2024-12-08',
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'New mobile application',
    color: '#10b981',
    members: ['Bob Johnson', 'Alice Williams'],
    createdAt: '2024-11-15',
    updatedAt: '2024-12-05',
  },
]

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: mockTasks,
  projects: mockProjects,
  filteredTasks: mockTasks,
  selectedProject: null,

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      ),
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },

  getTask: (id) => {
    return get().tasks.find((task) => task.id === id)
  },

  filterTasks: (status, priority) => {
    const { tasks } = get()
    let filtered = tasks

    if (status) {
      filtered = filtered.filter((task) => task.status === status)
    }

    if (priority) {
      filtered = filtered.filter((task) => task.priority === priority)
    }

    set({ filteredTasks: filtered })
  },

  addProject: (project) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({
      projects: [...state.projects, newProject],
    }))
  },

  setSelectedProject: (projectId) => {
    set({ selectedProject: projectId })
  },
}))
