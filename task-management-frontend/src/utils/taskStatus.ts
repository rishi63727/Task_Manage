/**
 * Single source of truth for task completion.
 * Completion is derived from status only: status === 'done'.
 * Never use task.completed for UI logic or filtering — always use these helpers.
 */
import type { Task } from '../types'

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const

export type TaskStatusValue = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export function getTaskStatus(task: Task | null | undefined): TaskStatusValue {
  const s = task?.status
  if (s === TASK_STATUS.DONE || s === TASK_STATUS.IN_PROGRESS || s === TASK_STATUS.TODO) return s
  return TASK_STATUS.TODO
}

/** Use this everywhere we need "is this task done?" — never task.completed */
export function isTaskDone(task: Task | null | undefined): boolean {
  return getTaskStatus(task) === TASK_STATUS.DONE
}

export function formatStatusLabel(status: string): string {
  return String(status).replace('_', ' ')
}
