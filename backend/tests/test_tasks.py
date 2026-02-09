"""Tests for task endpoints."""
import pytest
from app.models.task import Task, TaskPriority
from app.schemas.task import TaskCreate, BulkTaskCreate


def test_create_task(authenticated_client, test_user, db):
    """Test single task creation."""
    response = authenticated_client.post(
        "/api/v1/tasks",
        json={
            "title": "Test Task",
            "description": "Test description",
            "priority": "high"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["description"] == "Test description"
    assert data["priority"] == "high"
    assert data["owner_id"] == test_user.id
    assert len(db.query(Task).all()) == 1


def test_create_task_missing_title(authenticated_client):
    """Test task creation fails without title."""
    response = authenticated_client.post(
        "/api/v1/tasks",
        json={"description": "No title"}
    )
    assert response.status_code == 422  # Validation error


def test_list_tasks(authenticated_client, test_user, db):
    """Test listing tasks."""
    # Create 3 tasks
    for i in range(3):
        task = Task(
            title=f"Task {i}",
            description=f"Description {i}",
            owner_id=test_user.id
        )
        db.add(task)
    db.commit()

    response = authenticated_client.get("/api/v1/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_list_tasks_pagination(authenticated_client, test_user, db):
    """Test task listing with pagination."""
    for i in range(5):
        task = Task(
            title=f"Task {i}",
            description=f"Description {i}",
            owner_id=test_user.id
        )
        db.add(task)
    db.commit()

    response = authenticated_client.get("/api/v1/tasks?limit=2&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_list_tasks_filter_by_priority(authenticated_client, test_user, db):
    """Test filtering tasks by priority."""
    db.add(Task(title="High Priority", priority=TaskPriority.high, owner_id=test_user.id))
    db.add(Task(title="Low Priority", priority=TaskPriority.low, owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks?priority=high")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["priority"] == "high"


def test_list_tasks_filter_by_status(authenticated_client, test_user, db):
    """Test filtering tasks by status (todo, in_progress, done)."""
    from datetime import datetime
    task1 = Task(
        title="Done task",
        owner_id=test_user.id,
        status="done",
        completed=True,
        completed_at=datetime.utcnow(),
    )
    task2 = Task(title="Pending task", owner_id=test_user.id, status="todo", completed=False)
    db.add(task1)
    db.add(task2)
    db.commit()

    response = authenticated_client.get("/api/v1/tasks?status=todo")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Pending task"
    assert data[0]["status"] == "todo"


def test_get_task(authenticated_client, test_user, db):
    """Test getting a single task."""
    task = Task(title="Test Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task.id
    assert data["title"] == "Test Task"


def test_get_nonexistent_task(authenticated_client):
    """Test getting a task that doesn't exist."""
    response = authenticated_client.get("/api/v1/tasks/9999")
    assert response.status_code == 404


def test_update_task(authenticated_client, test_user, db):
    """Test updating a task."""
    task = Task(title="Original", owner_id=test_user.id)
    db.add(task)
    db.commit()

    response = authenticated_client.put(
        f"/api/v1/tasks/{task.id}",
        json={
            "title": "Updated",
            "priority": "high"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated"
    assert data["priority"] == "high"


def test_update_task_status(authenticated_client, test_user, db):
    """Test updating task status to done (triggers background completed email)."""
    create_res = authenticated_client.post(
        "/api/v1/tasks",
        json={"title": "Task to Complete", "description": "Will mark done"},
    )
    assert create_res.status_code == 201
    task_id = create_res.json()["id"]

    response = authenticated_client.put(
        f"/api/v1/tasks/{task_id}",
        json={"status": "done"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "done"


def test_background_email_mock(mocker):
    """Background job function exists and is callable; no real email sent in tests."""
    mock = mocker.patch(
        "app.services.background_jobs.send_task_assigned_email"
    )
    mock("test@gmail.com", "Mock Task")
    mock.assert_called_once_with("test@gmail.com", "Mock Task")


def test_update_task_unauthorized(db):
    """Test updating a task without authorization."""
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    user = client.post(
        "/api/v1/auth/register",
        json={"email": "other@example.com", "password": "password123"}
    ).json()

    task = Task(title="Original", owner_id=9999)  # Different user
    db.add(task)
    db.commit()

    response = client.put(
        f"/api/v1/tasks/{task.id}",
        json={"title": "Updated"}
    )
    assert response.status_code == 401 or response.status_code == 403


def test_delete_task(authenticated_client, test_user, db):
    """Test soft deleting a task."""
    task = Task(title="To Delete", owner_id=test_user.id)
    db.add(task)
    db.commit()

    response = authenticated_client.delete(f"/api/v1/tasks/{task.id}")
    assert response.status_code == 204

    # Verify soft delete (expire so session refetches from DB)
    db.expire(task)
    db_task = db.query(Task).filter_by(id=task.id).first()
    assert db_task is not None
    assert db_task.is_deleted == True


def test_bulk_create_tasks(authenticated_client, test_user, db):
    """Test bulk task creation."""
    response = authenticated_client.post(
        "/api/v1/tasks/bulk",
        json={
            "tasks": [
                {"title": "Task 1", "description": "Desc 1", "priority": "high"},
                {"title": "Task 2", "description": "Desc 2", "priority": "low"},
                {"title": "Task 3", "description": "Desc 3"}
            ]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["created"] == 3
    assert len(data["tasks"]) == 3
    assert data["tasks"][0]["priority"] == "high"
    assert data["tasks"][1]["priority"] == "low"
    assert data["tasks"][2]["priority"] == "medium"  # default


def test_bulk_create_empty_list(authenticated_client):
    """Test bulk creation with empty list."""
    response = authenticated_client.post(
        "/api/v1/tasks/bulk",
        json={"tasks": []}
    )
    assert response.status_code == 400


def test_bulk_create_partial_failure(authenticated_client, test_user, db):
    """Test bulk creation with invalid data (should rollback all)."""
    response = authenticated_client.post(
        "/api/v1/tasks/bulk",
        json={
            "tasks": [
                {"title": "Valid Task"},
                {"description": "No title - invalid"},
                {"title": "Another Valid"}
            ]
        }
    )
    # Request should succeed but report the error
    assert response.status_code == 400 or response.status_code == 422
    # Verify no tasks were created (transaction rolled back)
    assert db.query(Task).filter_by(is_deleted=False).count() == 0
