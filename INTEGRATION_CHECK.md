# Frontend–Backend Integration Check

Verified against the current backend (FastAPI) and frontend (Vite + React).

## API Base URL

- **Frontend** uses `VITE_API_URL` (e.g. in `task-management-frontend/.env.local`: `VITE_API_URL=http://localhost:8000`).
- If unset, the Vite dev server proxies `/api` and `/me` to `http://localhost:8000`, so dev still works.

## Endpoint Mapping

| Feature     | Frontend API                    | Backend route / behavior                    | Status  |
|------------|----------------------------------|---------------------------------------------|--------|
| Register   | POST `/api/v1/auth/register`     | Same                                         | OK     |
| Login      | POST `/api/v1/auth/login`        | Same                                         | OK     |
| Current user | GET `/me`                      | Root `GET /me` (main.py)                     | OK     |
| List tasks | GET `/api/v1/tasks?q=&status=&...` | Same, query params: q, priority, status, limit, offset, sort_by, sort_order | OK |
| Get task   | GET `/api/v1/tasks/:id`          | Same                                         | OK     |
| Create task | POST `/api/v1/tasks/`           | Same, body: title, description, priority, status, due_date, tags, assigned_to | OK |
| Update task | PUT `/api/v1/tasks/:id`         | Same                                         | OK     |
| Delete task | DELETE `/api/v1/tasks/:id`       | Same                                         | OK     |
| Bulk create | POST `/api/v1/tasks/bulk`       | Same, body: `{ tasks: TaskCreate[] }`        | OK     |
| Task comments | GET `/api/v1/tasks/:id/comments` | Same                                     | OK     |
| Add comment | POST `/api/v1/tasks/:id/comments` | Same, body: `{ content }`                   | OK     |
| Update comment | PUT `/api/v1/comments/:id`     | Same                                         | OK     |
| Delete comment | DELETE `/api/v1/comments/:id`  | Same                                         | OK     |
| Task files | GET `/api/v1/tasks/:id/files`    | Same                                         | OK     |
| Upload file | POST `/api/v1/tasks/:id/files`  | Same, multipart `file`                       | OK     |
| Download file | GET `/api/v1/files/:id`        | Same (files_by_id_router)                    | OK     |
| Delete file | DELETE `/api/v1/files/:id`       | Same                                         | OK     |
| Task summary | GET `/api/v1/analytics/tasks/summary` | Same                                 | OK     |
| User performance | GET `/api/v1/analytics/users/performance` | Same                          | OK     |
| Task trends | GET `/api/v1/analytics/tasks/trends?days=` | Same                              | OK     |
| Export     | GET `/api/v1/tasks/export?format=&...`     | Same, format=csv|json, completed, priority, limit, offset | OK |

## Auth

- **Token**: Stored in `localStorage` under key `token`.
- **Header**: Sent as `Authorization: Bearer <token>` on all requests (client and file/export fetch).
- **401**: Frontend clears token and dispatches `auth:logout`; auth context sends user to login.

## CORS

- Backend allows origins: `http://localhost:3000`, `http://localhost:5173` (and credentials).

## Error handling

- Backend: 422 with `detail` (string or list of validation errors), 4xx/5xx with `message` or `detail`.
- Frontend: Client parses `detail` (string or array) and `message` and throws an `Error` with a single message.

## Changes made during check

1. **Vite proxy**: Added `/me` proxy to `http://localhost:8000` so current-user works when `VITE_API_URL` is not set.
2. **Client errors**: Improved handling of backend `detail` when it is an array (e.g. validation errors).

## How to run

1. **Backend** (from `backend/`, with venv and Python 3.11):
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend** (from `task-management-frontend/`):
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173`; backend at `http://localhost:8000`. Ensure `task-management-frontend/.env.local` has `VITE_API_URL=http://localhost:8000` for direct API calls.
