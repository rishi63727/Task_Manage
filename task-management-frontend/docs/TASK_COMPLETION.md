# Task completion: single source of truth

## Rule

**Completion is derived from `status` only.**  
`status === 'done'` is the only source of truth. The backend stores `completed` and `completed_at` for convenience but keeps them in sync with `status` on every write.

## Do

- **Display "is done?"** → use `isTaskDone(task)` or `getTaskStatus(task) === TASK_STATUS.DONE` from `utils/taskStatus`.
- **Filter tasks** → filter by `status` (e.g. `status === 'done'`), never by `task.completed`.
- **Update completion** → send only `{ status: 'done' }` (or `'todo'` / `'in_progress'`). Never send a separate `completed` field.
- **TaskDetail state** → set `task` only from (1) load response or (2) update response. Never sync from a parent prop (e.g. `useEffect([task], () => setLocalTask(task))`) or the UI will roll back after an update.

## Don't

- Don't use `task.completed` for UI logic or filtering.
- Don't add a "Mark as done" that only sets `completed`; always update `status`.
- Don't mirror task from parent into local state and then overwrite it in `useEffect([task])` — that causes the "UI stuck" rollback when the parent still has stale data.

## Backend

- Export filter `completed=true` is implemented as `status == 'done'` (and `completed=false` as `status != 'done'`).
- Analytics "completed" counts use `Task.status == "done"`.
