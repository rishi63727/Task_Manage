"""Tests for export endpoints."""
import pytest
import csv
import json
from io import StringIO
from app.models.task import Task, TaskPriority


def test_export_csv(authenticated_client, test_user, db):
    """Test exporting tasks as CSV."""
    # Create test tasks
    db.add(Task(title="Task 1", description="Desc 1", priority=TaskPriority.high, 
                owner_id=test_user.id))
    db.add(Task(title="Task 2", description="Desc 2", priority=TaskPriority.low,
                completed=True, owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")

    # Parse CSV content
    csv_content = response.text
    reader = csv.DictReader(StringIO(csv_content))
    rows = list(reader)
    
    assert len(rows) == 2
    assert rows[0]["title"] == "Task 1"
    assert rows[0]["priority"] == "high"
    assert rows[1]["title"] == "Task 2"
    assert rows[1]["completed"] == "True"


def test_export_json(authenticated_client, test_user, db):
    """Test exporting tasks as JSON."""
    # Create test tasks
    db.add(Task(title="Task 1", description="Desc 1", priority=TaskPriority.high,
                owner_id=test_user.id))
    db.add(Task(title="Task 2", description="Desc 2", priority=TaskPriority.low,
                owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["title"] == "Task 1"
    assert data[0]["priority"] == "high"
    assert data[1]["title"] == "Task 2"


def test_export_missing_format(authenticated_client, test_user, db):
    """Test export without specifying format."""
    db.add(Task(title="Task", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export")
    assert response.status_code == 400


def test_export_invalid_format(authenticated_client, test_user, db):
    """Test export with invalid format."""
    db.add(Task(title="Task", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=xml")
    assert response.status_code == 400


def test_export_csv_with_priority_filter(authenticated_client, test_user, db):
    """Test exporting CSV filtered by priority."""
    db.add(Task(title="High 1", priority=TaskPriority.high, owner_id=test_user.id))
    db.add(Task(title="High 2", priority=TaskPriority.high, owner_id=test_user.id))
    db.add(Task(title="Low 1", priority=TaskPriority.low, owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=csv&priority=high")
    assert response.status_code == 200
    
    csv_content = response.text
    reader = csv.DictReader(StringIO(csv_content))
    rows = list(reader)
    
    assert len(rows) == 2
    assert all(row["priority"] == "high" for row in rows)


def test_export_json_with_completed_filter(authenticated_client, test_user, db):
    """Test exporting JSON filtered by completion status."""
    db.add(Task(title="Completed 1", completed=True, owner_id=test_user.id))
    db.add(Task(title="Completed 2", completed=True, owner_id=test_user.id))
    db.add(Task(title="Pending 1", completed=False, owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=json&completed=true")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2
    assert all(task["completed"] for task in data)


def test_export_csv_with_pagination(authenticated_client, test_user, db):
    """Test exporting CSV with limit and offset."""
    for i in range(10):
        db.add(Task(title=f"Task {i}", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=csv&limit=5&offset=0")
    assert response.status_code == 200
    
    csv_content = response.text
    reader = csv.DictReader(StringIO(csv_content))
    rows = list(reader)
    
    assert len(rows) == 5


def test_export_csv_headers_present(authenticated_client, test_user, db):
    """Test that CSV export has proper headers."""
    db.add(Task(title="Task", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=csv")
    assert response.status_code == 200
    
    csv_content = response.text
    reader = csv.DictReader(StringIO(csv_content))
    
    # Check headers
    expected_fields = ["id", "title", "description", "priority", "completed", "owner_id"]
    assert all(field in reader.fieldnames for field in expected_fields)


def test_export_json_includes_timestamps(authenticated_client, test_user, db):
    """Test that JSON export includes timestamp fields."""
    db.add(Task(title="Task", owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=json")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) > 0
    task = data[0]
    
    # Check for timestamp fields
    assert "created_at" in task
    assert task["created_at"] is not None


def test_export_excludes_deleted_tasks(authenticated_client, test_user, db):
    """Test that exports don't include deleted tasks."""
    db.add(Task(title="Active", is_deleted=False, owner_id=test_user.id))
    db.add(Task(title="Deleted", is_deleted=True, owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get("/api/v1/tasks/export?format=json")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Active"


def test_export_empty_result(authenticated_client, db):
    """Test exporting when no tasks exist."""
    response = authenticated_client.get("/api/v1/tasks/export?format=csv")
    assert response.status_code == 200
    
    csv_content = response.text
    # Should only have headers, no data rows
    lines = csv_content.strip().split("\n")
    assert len(lines) == 1  # Just the header line


def test_export_csv_multiple_filters(authenticated_client, test_user, db):
    """Test export with multiple filters applied."""
    db.add(Task(title="High Complete", priority=TaskPriority.high, completed=True,
                owner_id=test_user.id))
    db.add(Task(title="High Pending", priority=TaskPriority.high, completed=False,
                owner_id=test_user.id))
    db.add(Task(title="Low Complete", priority=TaskPriority.low, completed=True,
                owner_id=test_user.id))
    db.commit()

    response = authenticated_client.get(
        "/api/v1/tasks/export?format=csv&priority=high&completed=true"
    )
    assert response.status_code == 200
    
    csv_content = response.text
    reader = csv.DictReader(StringIO(csv_content))
    rows = list(reader)
    
    assert len(rows) == 1
    assert rows[0]["title"] == "High Complete"
    assert rows[0]["priority"] == "high"
    assert rows[0]["completed"] == "True"
