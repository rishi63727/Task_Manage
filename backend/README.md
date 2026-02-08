# Task Management API

A production-ready FastAPI backend for task management with user authentication, comments, file uploads, analytics, and export functionality.

## Features

- **User Authentication**: JWT-based registration and login
- **Task Management**: Create, read, update, and delete tasks with priority levels
- **Bulk Operations**: Create multiple tasks in a single request
- **Comments**: Add comments to tasks with full CRUD operations
- **File Uploads**: Upload and manage files associated with tasks (max 10MB)
- **Analytics**: Task summaries, user performance metrics, and trend analysis
- **Exports**: Export tasks as CSV or JSON with filtering
- **Rate Limiting**: 100 requests per minute per IP address
- **Soft Deletes**: All data is soft-deleted for recovery capability
- **Database Indexing**: Optimized queries on frequently accessed columns

## Tech Stack

- **FastAPI** 0.110.0 - Modern async Python web framework
- **SQLAlchemy** 2.0.27 - SQL ORM with declarative models
- **Pydantic** 2.6.1 - Data validation and serialization
- **Python-Jose** 3.3.0 - JWT token handling
- **Passlib + Bcrypt** - Secure password hashing
- **SlowAPI** 0.1.9 - Rate limiting
- **SQLite** - Default database (PostgreSQL compatible)

## Getting Started

### Prerequisites

- Python 3.8+
- pip or poetry

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with the following variables:
```
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Running the Server

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Interactive API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Base URL: `/api/v1`

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com"
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Tasks

#### Create Task
```
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "priority": "high"
}

Response: 201 Created
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "priority": "high",
  "completed": false,
  "owner_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "completed_at": null
}
```

#### List Tasks
```
GET /tasks?limit=10&offset=0&priority=high&completed=false
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "priority": "high",
    "completed": false,
    "owner_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Single Task
```
GET /tasks/{task_id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "priority": "high",
  "completed": false,
  "owner_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Update Task
```
PUT /tasks/{task_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "medium"
}

Response: 200 OK
{
  "id": 1,
  "title": "Updated title",
  "priority": "medium",
  ...
}
```

#### Delete Task (Soft Delete)
```
DELETE /tasks/{task_id}
Authorization: Bearer {token}

Response: 204 No Content
```

#### Bulk Create Tasks
```
POST /tasks/bulk
Authorization: Bearer {token}
Content-Type: application/json

{
  "tasks": [
    {"title": "Task 1", "priority": "high"},
    {"title": "Task 2", "priority": "medium"},
    {"title": "Task 3"}
  ]
}

Response: 201 Created
{
  "created": 3,
  "tasks": [
    {"id": 1, "title": "Task 1", "priority": "high", ...},
    {"id": 2, "title": "Task 2", "priority": "medium", ...},
    {"id": 3, "title": "Task 3", "priority": "medium", ...}
  ]
}
```

### Comments

#### Create Comment
```
POST /tasks/{task_id}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "This is a great task!"
}

Response: 201 Created
{
  "id": 1,
  "content": "This is a great task!",
  "task_id": 1,
  "user_id": 1,
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### List Comments
```
GET /tasks/{task_id}/comments?limit=10&offset=0
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "content": "This is a great task!",
    "task_id": 1,
    "user_id": 1,
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

#### Update Comment
```
PUT /comments/{comment_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated comment"
}

Response: 200 OK
{
  "id": 1,
  "content": "Updated comment",
  ...
}
```

#### Delete Comment
```
DELETE /comments/{comment_id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Files

#### Upload File
```
POST /tasks/{task_id}/files
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <binary file>

Response: 201 Created
{
  "id": 1,
  "filename": "document.pdf",
  "filepath": "uploads/secure_hash_document.pdf",
  "size": 5120,
  "content_type": "application/pdf",
  "uploaded_by": 1,
  "created_at": "2024-01-15T10:40:00Z"
}
```

#### List Task Files
```
GET /tasks/{task_id}/files
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "uploads/secure_hash_document.pdf",
    "size": 5120,
    "content_type": "application/pdf",
    "uploaded_by": 1,
    "created_at": "2024-01-15T10:40:00Z"
  }
]
```

#### Download File
```
GET /files/{file_id}
Authorization: Bearer {token}

Response: 200 OK (file download)
Content-Type: <actual file type>
```

#### Delete File
```
DELETE /files/{file_id}
Authorization: Bearer {token}

Response: 204 No Content
```

### Analytics

#### Task Summary
```
GET /analytics/summary
Authorization: Bearer {token}

Response: 200 OK
{
  "total": 25,
  "completed": 18,
  "pending": 7,
  "by_priority": {
    "high": 8,
    "medium": 12,
    "low": 5
  }
}
```

#### User Performance
```
GET /analytics/users/performance
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "user_id": 1,
    "email": "user@example.com",
    "tasks_assigned": 10,
    "tasks_completed": 8,
    "completion_rate": 80.0,
    "avg_completion_time_hours": 24.5
  }
]
```

#### Task Trends
```
GET /analytics/tasks/trends?days=30
Authorization: Bearer {token}

Response: 200 OK
{
  "daily_trends": [
    {
      "date": "2024-01-15",
      "tasks_created": 5,
      "tasks_completed": 3
    },
    {
      "date": "2024-01-14",
      "tasks_created": 2,
      "tasks_completed": 2
    }
  ]
}
```

### Exports

#### Export Tasks
```
GET /tasks/export?format=csv&priority=high&completed=false&limit=100&offset=0
Authorization: Bearer {token}

Response: 200 OK (CSV format)
Content-Type: text/csv

id,title,description,priority,completed,owner_id,created_at
1,Task 1,Description,high,false,1,2024-01-15T10:30:00Z
2,Task 2,Description,high,false,1,2024-01-15T10:35:00Z
```

Or with JSON format:
```
GET /tasks/export?format=json
Authorization: Bearer {token}

Response: 200 OK (JSON format)
Content-Type: application/json

[
  {
    "id": 1,
    "title": "Task 1",
    "description": "Description",
    "priority": "high",
    "completed": false,
    "owner_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

## Data Models

### Task
- `id`: Unique identifier
- `title`: Task title (required)
- `description`: Task description
- `priority`: Priority level (low, medium, high) - default: medium
- `completed`: Completion status
- `completed_at`: Timestamp when marked as complete
- `owner_id`: User who owns the task
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `is_deleted`: Soft delete flag

### User
- `id`: Unique identifier
- `email`: Email address (unique)
- `hashed_password`: Encrypted password
- `created_at`: Creation timestamp

### Comment
- `id`: Unique identifier
- `content`: Comment text
- `task_id`: Associated task
- `user_id`: Comment author
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `is_deleted`: Soft delete flag

### File
- `id`: Unique identifier
- `filename`: Original filename
- `filepath`: Secure storage path
- `size`: File size in bytes
- `content_type`: MIME type
- `task_id`: Associated task
- `uploaded_by`: User who uploaded
- `created_at`: Upload timestamp
- `is_deleted`: Soft delete flag

## Testing

Run the test suite:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

Run specific test file:
```bash
pytest tests/test_tasks.py
```

Run with specific markers:
```bash
pytest -m unit
```

## Error Handling

The API returns standard HTTP status codes and error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common status codes:
- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded

## Security

- Passwords are hashed with bcrypt
- JWT tokens are used for authentication (default 30 minute expiry)
- File uploads are validated for size (max 10MB) and type
- File paths are secured to prevent directory traversal
- Rate limiting prevents API abuse
- Soft deletes preserve data for recovery

## Database

Currently uses SQLite for development. To use PostgreSQL in production:

1. Install psycopg2: `pip install psycopg2-binary`
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost/dbname
   ```

### Database Indexes

The following columns are indexed for performance:
- `task.owner_id` - Filter tasks by user
- `task.completed` - Filter by completion status
- `task.created_at` - Sort by creation date
- `user.email` - Unique email lookup
- `comment.task_id` - Find comments for a task
- `file.task_id` - Find files for a task

## Deployment

### Environment Variables Required

```
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=your-strong-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Running in Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Future Enhancements

- [ ] Database migrations with Alembic
- [ ] Email notifications for task updates
- [ ] Task tags and categories
- [ ] Subtasks and dependencies
- [ ] User roles and permissions
- [ ] Webhook support
- [ ] Real-time updates with WebSockets
- [ ] Advanced filtering and search
- [ ] Task templates

## License

MIT License - see LICENSE file for details
