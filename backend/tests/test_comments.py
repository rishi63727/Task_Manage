"""Tests for comment endpoints."""
import pytest
from app.models.task import Task
from app.models.comment import Comment
from app.models.user import User


def test_create_comment(authenticated_client, test_user, db):
    """Test creating a comment on a task."""
    task = Task(title="Task for comments", owner_id=test_user.id)
    db.add(task)
    db.commit()

    response = authenticated_client.post(
        f"/api/v1/tasks/{task.id}/comments",
        json={"content": "Great task!"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Great task!"
    assert data["user_id"] == test_user.id
    assert data["task_id"] == task.id


def test_create_comment_on_nonexistent_task(authenticated_client):
    """Test creating a comment on a task that doesn't exist."""
    response = authenticated_client.post(
        "/api/v1/tasks/9999/comments",
        json={"content": "This will fail"}
    )
    assert response.status_code == 404


def test_create_comment_missing_content(authenticated_client, test_user, db):
    """Test creating a comment without content."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    response = authenticated_client.post(
        f"/api/v1/tasks/{task.id}/comments",
        json={}
    )
    assert response.status_code == 422


def test_list_task_comments(authenticated_client, test_user, db):
    """Test listing comments on a task."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    # Create 3 comments
    for i in range(3):
        comment = Comment(
            task_id=task.id,
            user_id=test_user.id,
            content=f"Comment {i}"
        )
        db.add(comment)
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}/comments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # API returns newest first (created_at desc)
    assert data[0]["content"] == "Comment 2"
    assert data[2]["content"] == "Comment 0"


def test_list_comments_pagination(authenticated_client, test_user, db):
    """Test listing comments with pagination."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    for i in range(5):
        db.add(Comment(task_id=task.id, user_id=test_user.id, content=f"Comment {i}"))
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}/comments?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_list_comments_excludes_deleted(authenticated_client, test_user, db):
    """Test that deleted comments are not returned."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    comment1 = Comment(task_id=task.id, user_id=test_user.id, content="Active")
    comment2 = Comment(task_id=task.id, user_id=test_user.id, content="Deleted", is_deleted=True)
    db.add(comment1)
    db.add(comment2)
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}/comments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["content"] == "Active"


def test_update_own_comment(authenticated_client, test_user, db):
    """Test updating your own comment."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    comment = Comment(task_id=task.id, user_id=test_user.id, content="Original")
    db.add(comment)
    db.commit()

    response = authenticated_client.put(
        f"/api/v1/comments/{comment.id}",
        json={"content": "Updated content"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"


def test_update_comment_by_other_user(test_user, db):
    """Test that other users cannot update comments."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.utils.auth import hash_password, create_access_token

    client = TestClient(app)
    
    # Create another user
    other_user = User(
        email="other@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(other_user)
    db.commit()

    # Create token for other user
    other_token = create_access_token(data={"sub": str(other_user.id)})
    client.headers = {"Authorization": f"Bearer {other_token}"}

    # Create task and comment by first user
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    comment = Comment(task_id=task.id, user_id=test_user.id, content="Original")
    db.add(comment)
    db.commit()

    # Try to update with other user
    response = client.put(
        f"/api/v1/comments/{comment.id}",
        json={"content": "Hacked"}
    )
    assert response.status_code == 403


def test_delete_own_comment(authenticated_client, test_user, db):
    """Test deleting your own comment."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    comment = Comment(task_id=task.id, user_id=test_user.id, content="To delete")
    db.add(comment)
    db.commit()

    response = authenticated_client.delete(f"/api/v1/comments/{comment.id}")
    assert response.status_code == 204

    # Verify soft delete (expire so session refetches from DB)
    db.expire(comment)
    db_comment = db.query(Comment).filter_by(id=comment.id).first()
    assert db_comment is not None
    assert db_comment.is_deleted == True


def test_delete_comment_by_other_user(test_user, db):
    """Test that other users cannot delete comments."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.utils.auth import hash_password, create_access_token

    client = TestClient(app)
    
    other_user = User(
        email="other@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(other_user)
    db.commit()

    other_token = create_access_token(data={"sub": str(other_user.id)})
    client.headers = {"Authorization": f"Bearer {other_token}"}

    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    comment = Comment(task_id=task.id, user_id=test_user.id, content="Original")
    db.add(comment)
    db.commit()

    response = client.delete(f"/api/v1/comments/{comment.id}")
    assert response.status_code == 403
