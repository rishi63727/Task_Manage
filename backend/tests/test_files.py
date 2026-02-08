"""Tests for file endpoints."""
import pytest
import io
from pathlib import Path
from app.models.task import Task
from app.models.file import File


def test_upload_file(authenticated_client, test_user, db):
    """Test uploading a file to a task."""
    task = Task(title="Task with files", owner_id=test_user.id)
    db.add(task)
    db.commit()

    file_content = io.BytesIO(b"Test file content")
    response = authenticated_client.post(
        f"/api/v1/tasks/{task.id}/files",
        files={"file": ("test.txt", file_content, "text/plain")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["content_type"] == "text/plain"
    assert data["uploaded_by"] == test_user.id


def test_upload_file_to_nonexistent_task(authenticated_client):
    """Test uploading a file to a task that doesn't exist."""
    file_content = io.BytesIO(b"Test content")
    response = authenticated_client.post(
        "/api/v1/tasks/9999/files",
        files={"file": ("test.txt", file_content, "text/plain")}
    )
    assert response.status_code == 404


def test_upload_oversized_file(authenticated_client, test_user, db):
    """Test that files larger than 10MB are rejected."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    # Create a 11MB file
    oversized_content = io.BytesIO(b"x" * (11 * 1024 * 1024))
    response = authenticated_client.post(
        f"/api/v1/tasks/{task.id}/files",
        files={"file": ("large.bin", oversized_content, "application/octet-stream")}
    )
    assert response.status_code == 400


def test_upload_disallowed_file_type(authenticated_client, test_user, db):
    """Test that disallowed file types are rejected."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    file_content = io.BytesIO(b"test")
    response = authenticated_client.post(
        f"/api/v1/tasks/{task.id}/files",
        files={"file": ("malware.exe", file_content, "application/x-msdownload")}
    )
    assert response.status_code == 400


def test_upload_multiple_files(authenticated_client, test_user, db):
    """Test uploading multiple files to a task."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    # Upload multiple times
    for i in range(3):
        file_content = io.BytesIO(f"Content {i}".encode())
        response = authenticated_client.post(
            f"/api/v1/tasks/{task.id}/files",
            files={"file": (f"file{i}.txt", file_content, "text/plain")}
        )
        assert response.status_code == 201

    # Verify all files are associated with task
    files = db.query(File).filter_by(task_id=task.id, is_deleted=False).all()
    assert len(files) == 3


def test_list_task_files(authenticated_client, test_user, db):
    """Test listing files for a task."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    # Create 2 files in database
    file1 = File(
        task_id=task.id,
        filename="file1.txt",
        filepath="uploads/secure_path_1.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=test_user.id
    )
    file2 = File(
        task_id=task.id,
        filename="file2.pdf",
        filepath="uploads/secure_path_2.pdf",
        size=5000,
        content_type="application/pdf",
        uploaded_by=test_user.id
    )
    db.add(file1)
    db.add(file2)
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}/files")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["filename"] == "file1.txt"
    assert data[1]["filename"] == "file2.pdf"


def test_list_files_excludes_deleted(authenticated_client, test_user, db):
    """Test that deleted files are not listed."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.commit()

    file1 = File(
        task_id=task.id,
        filename="active.txt",
        filepath="uploads/active.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=test_user.id,
        is_deleted=False
    )
    file2 = File(
        task_id=task.id,
        filename="deleted.txt",
        filepath="uploads/deleted.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=test_user.id,
        is_deleted=True
    )
    db.add(file1)
    db.add(file2)
    db.commit()

    response = authenticated_client.get(f"/api/v1/tasks/{task.id}/files")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["filename"] == "active.txt"


def test_get_file_details(authenticated_client, test_user, db):
    """Test getting file details."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    file = File(
        task_id=task.id,
        filename="document.txt",
        filepath="document.txt",
        size=250,
        content_type="text/plain",
        uploaded_by=test_user.id
    )
    db.add(file)
    db.commit()
    # Create file on disk so download returns 200 (app uses UPLOAD_BASE_DIR / filepath)
    Path("uploads").mkdir(parents=True, exist_ok=True)
    Path("uploads/document.txt").write_bytes(b"document content")

    response = authenticated_client.get(f"/api/v1/files/{file.id}")
    assert response.status_code == 200
    # For file download, FastAPI returns FileResponse
    assert "text/plain" in response.headers.get("content-type", "")


def test_delete_own_file(authenticated_client, test_user, db):
    """Test deleting a file you uploaded."""
    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    file = File(
        task_id=task.id,
        filename="deleteme.txt",
        filepath="deleteme.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=test_user.id
    )
    db.add(file)
    db.commit()
    Path("uploads").mkdir(parents=True, exist_ok=True)
    Path("uploads/deleteme.txt").write_bytes(b"content")

    response = authenticated_client.delete(f"/api/v1/files/{file.id}")
    assert response.status_code == 204

    # Verify soft delete (expire so session refetches from DB)
    db.expire(file)
    db_file = db.query(File).filter_by(id=file.id).first()
    assert db_file is not None
    assert db_file.is_deleted == True


def test_delete_file_by_task_owner(test_user, db):
    """Test that task owner can delete files."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.utils.auth import hash_password, create_access_token

    client = TestClient(app)
    
    # Create another user (uploader)
    from app.models.user import User
    uploader = User(
        email="uploader@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(uploader)
    db.commit()

    # Task owner
    task = Task(title="Task", owner_id=test_user.id)
    
    db.add(task)
    db.flush()
    
    # File uploaded by different user
    file = File(
        task_id=task.id,
        filename="file.txt",
        filepath="file.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=uploader.id
    )
    db.add(file)
    db.commit()
    Path("uploads").mkdir(parents=True, exist_ok=True)
    Path("uploads/file.txt").write_bytes(b"content")

    # Task owner deletes
    token = create_access_token(data={"sub": str(test_user.id)})
    client.headers = {"Authorization": f"Bearer {token}"}

    response = client.delete(f"/api/v1/files/{file.id}")
    assert response.status_code == 204


def test_delete_file_unauthorized(test_user, db):
    """Test that unauthorized users cannot delete files."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.utils.auth import hash_password, create_access_token
    from app.models.user import User

    client = TestClient(app)
    
    uploader = User(
        email="uploader@example.com",
        hashed_password=hash_password("password123")
    )
    other_user = User(
        email="other@example.com",
        hashed_password=hash_password("password123")
    )
    db.add(uploader)
    db.add(other_user)
    db.commit()

    task = Task(title="Task", owner_id=test_user.id)
    db.add(task)
    db.flush()
    
    file = File(
        task_id=task.id,
        filename="file.txt",
        filepath="file.txt",
        size=100,
        content_type="text/plain",
        uploaded_by=uploader.id
    )
    db.add(file)
    db.commit()
    Path("uploads").mkdir(parents=True, exist_ok=True)
    Path("uploads/file.txt").write_bytes(b"content")

    # Try to delete as other user
    token = create_access_token(data={"sub": str(other_user.id)})
    client.headers = {"Authorization": f"Bearer {token}"}

    response = client.delete(f"/api/v1/files/{file.id}")
    assert response.status_code == 403
