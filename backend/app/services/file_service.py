"""File service for business logic."""
import logging
import os
import secrets
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.models.file import File

logger = logging.getLogger(__name__)

# Configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
ALLOWED_EXTENSIONS = {
    ".pdf", ".jpg", ".jpeg", ".png", ".gif",
    ".txt", ".csv", ".json",
    ".docx", ".xlsx",
}


def validate_file(filename: str, content_type: str, file_size: int) -> tuple[bool, Optional[str]]:
    """Validate file before upload: size limit, content type, and extension allowlist."""
    if not filename:
        return False, "Filename is required"
    if file_size <= 0:
        return False, "File is empty"
    if file_size > MAX_FILE_SIZE:
        return False, f"File size exceeds {MAX_FILE_SIZE // (1024 * 1024)}MB limit"
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File extension not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
    if content_type not in ALLOWED_CONTENT_TYPES:
        return False, "File type not allowed"
    return True, None


def generate_secure_filepath(original_filename: str) -> str:
    """Generate a secure filepath to prevent traversal attacks."""
    # Extract extension safely
    ext = Path(original_filename).suffix.lower()
    if not ext:
        ext = ".bin"
    
    # Generate random filename
    random_name = secrets.token_hex(16)
    safe_filename = f"{random_name}{ext}"
    
    # Use relative path (no absolute paths)
    relative_path = f"task_files/{safe_filename}"
    return relative_path


def save_file_metadata(
    db: Session,
    task_id: int,
    filename: str,
    filepath: str,
    size: int,
    content_type: str,
    uploaded_by: int
) -> File:
    """Save file metadata to database."""
    file = File(
        task_id=task_id,
        filename=filename,
        filepath=filepath,
        size=size,
        content_type=content_type,
        uploaded_by=uploaded_by
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    logger.info(
        f"File {file.id} ({filename}) uploaded to task {task_id} by user {uploaded_by}"
    )
    return file


def soft_delete_file(db: Session, file: File) -> None:
    """Soft delete a file."""
    file.is_deleted = True
    db.commit()
    logger.info(f"File {file.id} soft deleted")


def get_task_files(
    db: Session,
    task_id: int,
    limit: int = 50,
    offset: int = 0
):
    """Get all non-deleted files for a task."""
    return db.query(File).filter(
        File.task_id == task_id,
        File.is_deleted == False
    ).order_by(File.created_at.desc()).offset(offset).limit(limit).all()
