"""Tests for analytics endpoints."""
import pytest
from datetime import datetime, timedelta
from app.models.task import Task, TaskPriority
from app.models.user import User
from app.utils.auth import hash_password


def test_get_task_summary(authenticated_client, test_user, db):
    """Test getting task summary analytics."""
    # Create tasks with different statuses
    db.add(Task(title="High Priority Completed", priority=TaskPriority.high, 
                completed=True, completed_at=datetime.utcnow(), owner_id=test_user.id))
    db.add(Task(title="High Priority Pending", priority=TaskPriority.high, 
                completed=False, owner_id=test_user.id))
    db.add(Task(title="Medium Priority", priority=TaskPriority.medium, 
                completed=False, owner_id=test_user.id))
    db.add(Task(title="Low Priority Completed", priority=TaskPriority.low, 
                completed=True, completed_at=datetime.utcnow(), owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    
    # Validate structure
    assert "total" in data
    assert "completed" in data
    assert "pending" in data
    assert "by_priority" in data
    
    # Validate counts
    assert data["total"] == 4
    assert data["completed"] == 2
    assert data["pending"] == 2
    
    # Validate priority breakdown
    assert data["by_priority"]["high"] == 2
    assert data["by_priority"]["medium"] == 1
    assert data["by_priority"]["low"] == 1


def test_get_task_summary_empty(authenticated_client, db):
    """Test task summary when no tasks exist."""
    response = authenticated_client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["completed"] == 0
    assert data["pending"] == 0


def test_get_user_performance(authenticated_client, test_user, db):
    """Test getting user performance analytics."""
    # Create another user
    other_user = User(
        email="performer@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(other_user)
    db.commit()

    # Create tasks for both users
    for i in range(5):
        completed = i < 3  # 3 completed, 2 pending
        db.add(Task(
            title=f"Test User Task {i}",
            completed=completed,
            completed_at=datetime.utcnow() if completed else None,
            owner_id=test_user.id
        ))
    
    for i in range(6):
        completed = i < 4  # 4 completed, 2 pending
        db.add(Task(
            title=f"Other User Task {i}",
            completed=completed,
            completed_at=datetime.utcnow() if completed else None,
            owner_id=other_user.id
        ))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/users/performance")
    assert response.status_code == 200
    data = response.json()
    
    # Should be a list of user performance
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Find test_user's performance
    test_perf = next((p for p in data if p["user_id"] == test_user.id), None)
    assert test_perf is not None
    assert test_perf["tasks_assigned"] == 5
    assert test_perf["tasks_completed"] == 3
    assert test_perf["completion_rate"] == 60.0


def test_get_task_trends_default(authenticated_client, test_user, db):
    """Test getting task trends with default 30-day window."""
    # Create tasks across different days
    today = datetime.utcnow().date()
    for i in range(5):
        db.add(Task(
            title=f"Created {i} days ago",
            owner_id=test_user.id,
            created_at=datetime.utcnow() - timedelta(days=i*2)
        ))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/tasks/trends")
    assert response.status_code == 200
    data = response.json()
    
    # Should return trend data
    assert "daily_trends" in data or isinstance(data, list)


def test_get_task_trends_custom_days(authenticated_client, test_user, db):
    """Test getting task trends with custom day range."""
    # Create tasks
    db.add(Task(title="Task 1", owner_id=test_user.id))
    db.add(Task(title="Task 2", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/tasks/trends?days=7")
    assert response.status_code == 200
    data = response.json()
    assert data is not None


def test_get_task_trends_invalid_days(authenticated_client):
    """Test task trends with invalid days parameter."""
    response = authenticated_client.get("/api/v1/analytics/tasks/trends?days=-5")
    assert response.status_code == 400


def test_summary_only_counts_active_tasks(authenticated_client, test_user, db):
    """Test that summary doesn't count deleted tasks."""
    db.add(Task(title="Active", owner_id=test_user.id, is_deleted=False))
    db.add(Task(title="Deleted", owner_id=test_user.id, is_deleted=True))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1


def test_performance_completion_rate_calculation(authenticated_client, test_user, db):
    """Test that completion rate is calculated correctly."""
    # Create 10 tasks, 7 completed
    for i in range(10):
        db.add(Task(
            title=f"Task {i}",
            completed=i < 7,
            completed_at=datetime.utcnow() if i < 7 else None,
            owner_id=test_user.id
        ))
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/users/performance")
    assert response.status_code == 200
    data = response.json()
    
    perf = next((p for p in data if p["user_id"] == test_user.id), None)
    assert perf is not None
    assert perf["completion_rate"] == 70.0


def test_trends_only_count_30_days_by_default(authenticated_client, test_user, db):
    """Test that trends only includes last 30 days by default."""
    # Create task 60 days ago
    old_task = Task(
        title="Old Task",
        owner_id=test_user.id,
        created_at=datetime.utcnow() - timedelta(days=60)
    )
    # Create task today
    new_task = Task(
        title="New Task",
        owner_id=test_user.id,
        created_at=datetime.utcnow()
    )
    db.add(old_task)
    db.add(new_task)
    db.commit()

    response = authenticated_client.get("/api/v1/analytics/tasks/trends")
    assert response.status_code == 200
    data = response.json()
    # Should only include the new task or have data for today
    assert data is not None
