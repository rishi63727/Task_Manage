# Task Management Frontend

React + TypeScript frontend for the Task Management API. Built with Vite, React Router, and custom CSS (no CSS frameworks).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure the backend is running at `http://localhost:8000` (or set `VITE_API_URL` in `.env.local`).

3. Start the dev server:
   ```bash
   npm run dev
   ```

   The app will be at `http://localhost:5173`.

## Features

- **Auth**: Login and register with email/password; JWT stored in localStorage.
- **Dashboard**: Overview stats (total, completed, pending, overdue tasks) and quick actions.
- **Tasks**: List with search, filters (status, priority), sort, and pagination; detail view with comments and file upload (drag-and-drop).
- **Task create/edit**: Form with validation (title required; status, priority, due date, tags).
- **Profile**: Current user email and ID.
- **Analytics**: Task summary charts (by priority, by status), trend line chart (created vs completed over days), user performance table, and CSV/JSON export.

## Tech

- React 18, TypeScript, React Router 6
- State: React context (auth); server state via API calls
- Styling: Custom CSS (CSS variables, no Tailwind/Bootstrap)
- Charts: Recharts
- Performance: Lazy-loaded routes, memo-friendly structure

## Build

```bash
npm run build
```

Output is in `dist/`. Preview with `npm run preview`.
