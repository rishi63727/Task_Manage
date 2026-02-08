# Frontend-Backend Integration Guide

## Setup

### Prerequisites
- Python 3.11+ with pip
- Node.js 18+ with npm/pnpm
- SQLite (comes with Python)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd task-management-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. The `.env.local` file is already configured with:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Run the frontend:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   The frontend will be available at `http://localhost:5173`

## API Integration

### Available API Modules

All API calls are handled through `/src/api/`:

#### Authentication (`authAPI`)
```typescript
import { authAPI } from '@/api';

await authAPI.register(email, password);
await authAPI.login(email, password);
await authAPI.getMe(); // Get current user
```

#### Tasks (`tasksAPI`)
```typescript
import { tasksAPI } from '@/api';

await tasksAPI.getTasks(params); // Get all tasks
await tasksAPI.getTask(id); // Get single task
await tasksAPI.createTask(data); // Create task
await tasksAPI.updateTask(id, data); // Update task
await tasksAPI.deleteTask(id); // Delete task
await tasksAPI.createBulkTasks(tasks); // Bulk create
```

#### Comments (`commentsAPI`)
```typescript
import { commentsAPI } from '@/api';

await commentsAPI.getTaskComments(taskId, params);
await commentsAPI.createComment(taskId, content);
await commentsAPI.updateComment(commentId, content);
await commentsAPI.deleteComment(commentId);
```

#### Files (`filesAPI`)
```typescript
import { filesAPI } from '@/api';

await filesAPI.getFiles(params);
await filesAPI.getFile(id);
await filesAPI.uploadFile(formData);
await filesAPI.deleteFile(id);
await filesAPI.getTaskFiles(taskId);
```

#### Analytics (`analyticsAPI`)
```typescript
import { analyticsAPI } from '@/api';

await analyticsAPI.getTaskSummary();
await analyticsAPI.getUserPerformance();
await analyticsAPI.getTaskTrends(days);
```

#### Exports (`exportsAPI`)
```typescript
import { exportsAPI } from '@/api';

await exportsAPI.exportTasks({ format: 'csv', ...params });
await exportsAPI.exportTasks({ format: 'json', ...params });
```

## CORS Configuration

The backend is already configured to accept requests from:
- `http://localhost:3000` (React local)
- `http://localhost:5173` (Vite local)

## Authentication

- Tokens are automatically stored in `localStorage` with key `token`
- Tokens are automatically sent with every request via Authorization header
- On 401 responses, tokens are cleared and `auth:logout` event is dispatched
- The backend expects tokens in the format: `Authorization: Bearer <token>`

## Backend API Documentation

Once the backend is running, visit:
- `http://localhost:8000/docs` - Interactive Swagger UI
- `http://localhost:8000/redoc` - ReDoc documentation

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **Rate Limiting**: Backend has a default rate limit of 100 requests/minute per IP
3. **Database**: The backend uses SQLite, stored in the database file
4. **Logs**: Check terminal output for debugging errors

## Troubleshooting

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check that CORS is enabled (should be by default)
- Verify `.env.local` has correct `VITE_API_URL`

### 401 Unauthorized errors
- User is not authenticated or token expired
- Log in again and check token is stored in localStorage

### 422 Validation errors
- Request data doesn't match expected schema
- Check API documentation at `/docs` endpoint for required fields
