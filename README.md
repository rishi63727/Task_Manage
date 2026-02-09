# Task Management System

A full-stack task management application with user authentication, task CRUD with file attachments, comments, analytics, real-time updates, and optional email notifications. Built with **FastAPI** (backend) and **React + TypeScript + Vite** (frontend).

## Features

- **Auth:** Register, login, JWT-protected profile
- **Tasks:** Create, list (filter/search/sort/pagination), get, update, soft delete; **bulk create** (API + UI)
- **Comments:** Add, list, update, delete; Markdown rendering
- **Files:** Upload (type/size validated), list, download, delete
- **Analytics:** Task summary, user performance, trends; export (CSV/JSON)
- **Real-time:** WebSocket events for task changes
- **UI:** Dashboard, task list/detail/form, bulk create page, profile, analytics; light/dark mode; responsive layout

---

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [How to Run the Application](#how-to-run-the-application)
- [Architecture Decisions](#architecture-decisions)
- [Assumptions Made](#assumptions-made)
- [Architecture Diagram](#architecture-diagram)

---

## Setup Instructions

### Prerequisites

- **Python 3.11+** (backend)
- **Node.js 18+** and npm (frontend)
- **Redis** (for cache and optional Celery; can run without for dev with in-memory fallback)
- **PostgreSQL 15** (optional for local dev; SQLite is the default)

### Backend Setup

1. **Clone the repository** (if not already) and go to the backend:

   ```bash
   cd backend
   ```

2. **Create a virtual environment and install dependencies:**

   ```bash
   python -m venv venv
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Windows (CMD) / Linux / macOS:
   # source venv/bin/activate  (Linux/macOS)

   pip install -r requirements.txt
   ```

3. **Configure environment:** Copy the example env file and set your values:

   ```bash
   copy .env.example .env   # Windows
   # cp .env.example .env  # Linux/macOS
   ```

   Edit `backend/.env` with your `SECRET_KEY`, and optionally `DATABASE_URL`, `REDIS_URL`, and mail settings. See [Environment Variables](#environment-variables) below.

4. **Database:** With default `DATABASE_URL=sqlite:///./app.db`, the app creates tables on first run. For PostgreSQL, create the database and run migrations (or rely on `create_all` in dev).

### Frontend Setup

1. **From the project root**, go to the frontend and install dependencies:

   ```bash
   cd task-management-frontend
   npm install
   ```

2. **Environment:** The frontend uses `VITE_API_URL` at build time. Default is `http://localhost:8000`. For Docker preview it is set in `docker-compose.yml`.

### Docker Setup (optional)

- **Docker** and **Docker Compose** installed.
- From the **project root**:

  ```bash
  docker compose up --build
  ```

  This starts:
  - **Backend** on `http://localhost:8000` (uses Postgres and Redis from compose)
  - **PostgreSQL** on port 5432
  - **Redis** on port 6379
  - **Frontend** (Vite preview) on `http://localhost:4173`

  Ensure `backend/.env` exists; compose overrides `DATABASE_URL` and `REDIS_URL` for the backend service.

---

## Environment Variables

Backend reads from `backend/.env`. Use `backend/.env.example` as a template.

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `SECRET_KEY` | JWT signing key; use a long random value in production | `your-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry in minutes | `30` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./app.db` (local). Docker: `postgresql://postgres:postgres@db:5432/autonize` |
| `REDIS_URL` | Redis connection URL (cache, optional Celery) | `redis://localhost:6379/0`. Docker: `redis://redis:6379/0` |
| `MAIL_HOST` | SMTP host for email notifications | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP username (e.g. Gmail address) | — |
| `MAIL_PASSWORD` | SMTP password (e.g. Gmail app password) | — |
| `MAIL_FROM` | From address for outgoing mail | `Task Manager <your-email@gmail.com>` |

- **Local dev:** SQLite + optional Redis; mail is optional (no mail configured = no emails sent).
- **Docker:** Set `DATABASE_URL` and `REDIS_URL` in `docker-compose.yml` (or env) so the backend uses the `db` and `redis` services.

---

## How to Run the Application

### Option 1: Local development (backend + frontend)

1. **Start Redis** (optional but recommended for cache):

   ```bash
   redis-server
   ```

2. **Start the backend** (from `backend/`, with venv activated):

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - API: `http://localhost:8000`
   - Swagger docs: `http://localhost:8000/docs`

3. **Start the frontend** (from `task-management-frontend/`):

   ```bash
   npm run dev
   ```

   - App: `http://localhost:5173` (Vite dev server)

4. Use the app in the browser; it will call the API at `http://localhost:8000` (or whatever `VITE_API_URL` was at build time for production builds).

5. **Test user credentials:** Register a new user from the app (Register page) with any email and password (minimum 8 characters). For manual API testing (e.g. Swagger at `/docs`), you can use the same credentials as the test suite after registering once: **`test@example.com`** / **`testpassword123`** (see `backend/tests/conftest.py`).

### Option 2: Docker Compose

From the **project root**:

```bash
docker compose up --build
```

- **Backend:** `http://localhost:8000`
- **Frontend (preview):** `http://localhost:4173`
- **PostgreSQL:** localhost:5432 (user `postgres`, password `postgres`, db `autonize`)
- **Redis:** localhost:6379

Ensure `backend/.env` exists; compose injects `DATABASE_URL` and `REDIS_URL` for the backend container.

### Running tests (backend)

From `backend/` (venv activated):

```bash
pytest tests/ -v
```

Uses in-memory SQLite and overridden dependencies (see `tests/conftest.py`). Redis is not required for tests (cache can fall back to in-memory).

---

## Architecture Decisions

### Backend

- **Framework:** FastAPI for async support, automatic OpenAPI docs, and Pydantic validation.
- **Database:** SQLAlchemy ORM with a single engine/session factory. Default dev DB is SQLite; production can use PostgreSQL (same code; connection string only).
- **Auth:** JWT (Bearer) with `python-jose` and Passlib (bcrypt) for passwords. Protected routes depend on `get_current_user`.
- **Structure:** Route modules per domain (auth, tasks, comments, files, analytics, exports, users, websockets); services for business logic; schemas for request/response and validation; models for SQLAlchemy.
- **Soft deletes:** Tasks, comments, and files use an `is_deleted` flag so data can be retained and filtered in queries.
- **Caching:** FastAPI-Cache with Redis backend for analytics (and optional task-list caching). In-memory fallback if Redis is unavailable.
- **Rate limiting:** SlowAPI (e.g. 100 req/min per IP) with CORS and OPTIONS pass-through middleware order to avoid blocking preflight.
- **Files:** Stored on disk under `uploads/` with generated paths; metadata in DB. Validation: allowed extensions, content types, and max size (e.g. 10 MB).
- **Input sanitization:** Text fields (task title/description, comment content) are sanitized (strip script/HTML and limit length) before persistence.
- **Real-time:** WebSocket endpoint for broadcasting task created/updated/deleted so clients can refresh or update UI.
- **Email:** Optional; background tasks send mail on events (e.g. task assigned/completed) via FastAPI-Mail. Celery/worker can be used for heavier jobs.

### Frontend

- **Stack:** React 18, TypeScript, Vite, React Router. No UI framework; custom CSS with variables for theming.
- **State:** React context for auth and users; local state and API calls for tasks, comments, files. WebSocket client for real-time updates where needed.
- **API:** Centralized API modules (auth, tasks, comments, files, analytics, exports, users) calling the backend with fetch and JWT in headers.
- **Theming:** Light/dark mode via `ThemeContext` and `data-theme` on the document root; preference stored in localStorage.
- **Comments:** Rendered as Markdown (e.g. `react-markdown`) for simple formatting.

### DevOps / Deployment

- **Docker:** Backend and frontend have Dockerfiles; compose wires backend, Postgres, Redis, and frontend. Backend uses env file and compose-set `DATABASE_URL` / `REDIS_URL`.
- **Migrations:** Alembic is present; in dev, `Base.metadata.create_all` in startup can create tables. For production, prefer running Alembic migrations.

---

## Assumptions Made

1. **Single-tenant / per-user data:** Tasks and related data are scoped by `owner_id`; users see only their own tasks (and assignees see tasks assigned to them where applicable). No shared workspaces or org-level roles in scope.
2. **File storage:** Files are stored on the server filesystem under `uploads/`. For horizontal scaling or cloud deployment, a shared or object-storage backend would be assumed later.
3. **Email is optional:** The app runs without mail configuration; notifications are a bonus. SMTP credentials are not required for core functionality.
4. **Redis is optional for dev:** Cache falls back to in-memory if Redis is unavailable so local dev works without Redis. Docker and production assume Redis for cache (and optionally Celery).
5. **Browser support:** Modern browsers with ES and fetch support. No IE11.
6. **CORS:** Configured for local dev and Docker (e.g. localhost:3000, 5173, 4173). Production would use a specific frontend origin list.
7. **Secrets:** No secrets in repo; `.env` is gitignored. Production must set strong `SECRET_KEY` and DB/Redis credentials.
8. **Soft delete only:** No hard delete for tasks/comments/files; “delete” means marking `is_deleted`. No purge/retention policy in scope.
9. **Markdown in comments:** Comment body is stored as plain text and rendered as Markdown on the frontend; no server-side HTML storage.
10. **Task assignment:** `assigned_to` is a user ID; no richer assignment model (e.g. multiple assignees or roles) in scope.

---

## Project Structure (high level)

```
Autonomize.ai/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── main.py         # App entry, middleware, routers
│   │   ├── database.py     # SQLAlchemy engine and session
│   │   ├── models/         # User, Task, Comment, File
│   │   ├── routes/         # auth, tasks, comments, files, analytics, exports, users, websockets
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # Business logic and external integrations
│   │   └── utils/          # auth, sanitize, cache helpers
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
├── task-management-frontend/   # React + Vite SPA
│   ├── src/
│   │   ├── api/            # API client modules
│   │   ├── components/
│   │   ├── context/        # Auth, Users, Theme
│   │   ├── pages/
│   │   └── styles/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # backend, db, redis, frontend
├── ARCHITECTURE.md         # Architecture diagrams (Mermaid)
└── README.md               # This file
```

---

## Architecture Diagram

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for Mermaid diagrams: system overview, backend request flow, backend/frontend structure, authentication flow, and WebSocket real-time updates.

---

For more detail on the API, see **http://localhost:8000/docs** when the backend is running. A static OpenAPI 3.1 spec is available as **`openapi.yaml`** in the project root (Swagger/OpenAPI format).
