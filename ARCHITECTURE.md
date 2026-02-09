# Task Management System — Architecture

This document describes the high-level architecture and main data flows.

---

## System overview

```mermaid
flowchart TB
  subgraph client [Client]
    Browser[Browser]
    SPA[React SPA]
    Browser --> SPA
  end

  subgraph backend [Backend]
    API[FastAPI]
    API --> Auth[auth]
    API --> Tasks[tasks]
    API --> Comments[comments]
    API --> Files[files]
    API --> Analytics[analytics]
    API --> Exports[exports]
    API --> Users[users]
    API --> WebSockets[websockets]
  end

  subgraph data [Data layer]
    DB[(SQLite / PostgreSQL)]
    Redis[(Redis)]
  end

  subgraph optional [Optional]
    SMTP[SMTP Mail]
  end

  SPA -->|"REST + JWT"| API
  SPA -.->|"WebSocket"| WebSockets
  API --> DB
  API --> Redis
  API -.-> SMTP
```

- **Client:** React + TypeScript + Vite SPA; talks to backend via REST (JWT in `Authorization` header) and optionally WebSocket for real-time task events.
- **Backend:** FastAPI app; routers for auth, tasks, comments, files, analytics, exports, users, websockets. Uses SQLAlchemy for DB and Redis for cache (with in-memory fallback).
- **Optional:** Email (e.g. task assigned/completed) via SMTP when configured.

---

## Backend request flow

```mermaid
flowchart LR
  subgraph middleware [Middleware order]
    CORS[CORS]
    Options[OPTIONS pass-through]
    RateLimit[SlowAPI rate limit]
    CORS --> Options --> RateLimit
  end

  subgraph request [Request handling]
    Route[Route handler]
    Service[Service layer]
    Model[ORM Model]
    Route --> Service --> Model
  end

  subgraph persistence [Persistence]
    Session[DB Session]
    Cache[Cache]
    Session --> DB[(Database)]
    Cache --> Redis[(Redis)]
  end

  RateLimit --> Route
  Service --> Session
  Service --> Cache
```

- **Middleware:** CORS first, then OPTIONS pass-through (so preflight is not rate-limited), then SlowAPI (e.g. 100 req/min per IP).
- **Request path:** Route (e.g. `routes/tasks.py`) → service (e.g. `services/task_service.py`) → model + DB session. Schemas (Pydantic) validate request/response; routes depend on `get_current_user` for protected endpoints.
- **Cache:** Used for analytics (and optionally task list); Redis with in-memory fallback when Redis is unavailable.

---

## Backend structure

```mermaid
flowchart TB
  subgraph app [app]
    main[main.py]
    database[database.py]
    main --> database

    subgraph routes [routes]
      auth[auth]
      tasks[tasks]
      comments[comments]
      files[files]
      analytics[analytics]
      exports[exports]
      users[users]
      websockets[websockets]
    end

    subgraph services [services]
      task_svc[task_service]
      analytics_svc[analytics_service]
      file_svc[file_service]
      email_svc[email_service]
      ws_manager[websocket_manager]
    end

    subgraph models [models]
      User[User]
      Task[Task]
      Comment[Comment]
      File[File]
    end

    subgraph utils [utils]
      auth_util[auth]
      sanitize[sanitize]
      cache[cache]
    end

    main --> routes
    routes --> services
    services --> models
    services --> utils
  end
```

- **main.py:** Mounts routers, middleware, startup (DB create_all, cache init), exception handlers.
- **routes/*:** HTTP handlers; call services and return schemas.
- **services/*:** Business logic, file storage, WebSocket broadcast, optional email.
- **models/*:** SQLAlchemy models (User, Task, Comment, File).
- **utils/*:** JWT/password (auth), input sanitization, cache helpers.

---

## Frontend structure

```mermaid
flowchart TB
  subgraph src [src]
    App[App.tsx]
    Router[React Router]

    subgraph pages [pages]
      Dashboard[Dashboard]
      TaskList[TaskList]
      TaskDetail[TaskDetail]
      TaskForm[TaskForm]
      BulkCreate[BulkCreateTasks]
      Analytics[Analytics]
      Profile[Profile]
      Login[Login]
      Register[Register]
    end

    subgraph api [api]
      client[client.ts]
      auth_api[auth]
      tasks_api[tasks]
      comments_api[comments]
      files_api[files]
      analytics_api[analytics]
      users_api[users]
      client --> auth_api
      client --> tasks_api
      client --> comments_api
      client --> files_api
      client --> analytics_api
      client --> users_api
    end

    subgraph context [context]
      AuthContext[AuthContext]
      ThemeContext[ThemeContext]
      UsersContext[UsersContext]
    end

    subgraph components [components]
      Layout[Layout]
      ProtectedRoute[ProtectedRoute]
      ConfirmDialog[ConfirmDialog]
      FileUpload[FileUpload]
    end

    App --> Router
    Router --> pages
    pages --> api
    pages --> context
    pages --> components
  end

  api -->|"VITE_API_URL"| Backend[Backend API]
```

- **App + Router:** Entry and route definitions; protected routes use `ProtectedRoute`.
- **pages/*:** Dashboard, task list/detail/form, bulk create, analytics, profile, login/register. They use `api/*` and `context/*`.
- **api/*:** `client.ts` sets base URL and JWT header; domain modules (auth, tasks, comments, files, analytics, users) call backend.
- **context/*:** Auth (user + token), theme (light/dark), users list (e.g. assignee dropdown).
- **components/*:** Layout, ProtectedRoute, ConfirmDialog, FileUpload, etc.

---

## Authentication flow

```mermaid
sequenceDiagram
  participant User
  participant SPA
  participant API
  participant DB

  User->>SPA: Login (email, password)
  SPA->>API: POST /api/v1/auth/login
  API->>DB: Find user, verify password
  DB-->>API: User
  API-->>SPA: JWT access_token
  SPA->>SPA: Store token (e.g. localStorage)
  User->>SPA: Request protected resource
  SPA->>API: GET /api/v1/... + Authorization Bearer JWT
  API->>API: get_current_user(JWT)
  API->>DB: Load user by id
  DB-->>API: User
  API-->>SPA: 200 + data
```

- Login returns a JWT; frontend stores it and sends it in the `Authorization` header.
- Protected routes use FastAPI dependency `get_current_user` (decode JWT, load user from DB).

---

## Real-time updates (WebSocket)

```mermaid
sequenceDiagram
  participant Client1
  participant API
  participant Manager
  participant Client2

  Client1->>API: Connect WebSocket
  API->>Manager: Register connection
  Client2->>API: Create/update/delete task
  API->>Manager: Broadcast event
  Manager->>Client1: Send event
  Client1->>Client1: Refresh list or update UI
```

- Backend: `WebSocketManager` keeps active connections; task create/update/delete handlers call broadcast.
- Frontend: `services/socket.ts` (or similar) connects and subscribes; on message, refresh task list or update local state.

---

## File references

| Layer   | Key paths |
|--------|-----------|
| Backend entry | [backend/app/main.py](backend/app/main.py) |
| Backend DB    | [backend/app/database.py](backend/app/database.py) |
| Backend routes | [backend/app/routes/](backend/app/routes/) |
| Backend services | [backend/app/services/](backend/app/services/) |
| Frontend API  | [task-management-frontend/src/api/client.ts](task-management-frontend/src/api/client.ts) |
| Frontend auth | [task-management-frontend/src/context/AuthContext.tsx](task-management-frontend/src/context/AuthContext.tsx) |

For setup and run instructions, see [README.md](README.md).
