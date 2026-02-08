"""Files router for task file uploads."""
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse as StarletteFileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.file import File as FileModel
from app.models.task import Task
from app.schemas.file import FileResponse
from app.services import file_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["Files"])

# Standalone file routes by file_id (for GET/DELETE /api/v1/files/{file_id})
files_by_id_router = APIRouter(prefix="/api/v1/files", tags=["Files"])

# Ensure upload directory exists
UPLOAD_BASE_DIR = Path("uploads")
UPLOAD_BASE_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/{task_id}/files", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Upload a file to a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload files to this task")
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Validate file
    is_valid, error_msg = file_service.validate_file(
        file.filename,
        file.content_type,
        file_size
    )
    
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    # Generate secure filepath
    safe_filepath = file_service.generate_secure_filepath(file.filename)
    full_path = UPLOAD_BASE_DIR / safe_filepath
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file to disk
    try:
        with open(full_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error saving file")
    
    # Save file metadata
    file_obj = file_service.save_file_metadata(
        db,
        task_id=task_id,
        filename=file.filename,
        filepath=safe_filepath,
        size=file_size,
        content_type=file.content_type,
        uploaded_by=current_user.id
    )
    
    return file_obj


@router.get("/{task_id}/files", response_model=List[FileResponse], status_code=status.HTTP_200_OK)
def list_task_files(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """List all files for a task."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Only task owner can view files
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view files for this task")
    
    files = db.query(FileModel).filter(
        FileModel.task_id == task_id,
        FileModel.is_deleted == False
    ).all()
    
    return files


def _get_file_and_check_auth(file_id: int, db: Session, current_user):
    """Load file and check auth (owner or uploader); raise HTTPException if not found or unauthorized."""
    file_obj = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.is_deleted == False
    ).first()
    if not file_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    task = db.query(Task).filter(Task.id == file_obj.task_id).first()
    if not task or (task.owner_id != current_user.id and file_obj.uploaded_by != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this file")
    return file_obj, task


@router.get("/files/{file_id}", status_code=status.HTTP_200_OK)
def download_file_task_scope(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Download a file (under /api/v1/tasks/files/{file_id})."""
    file_obj, _ = _get_file_and_check_auth(file_id, db, current_user)
    full_path = UPLOAD_BASE_DIR / file_obj.filepath
    if not full_path.exists():
        logger.error(f"File not found on disk: {full_path}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")
    return StarletteFileResponse(path=full_path, filename=file_obj.filename, media_type=file_obj.content_type)


@files_by_id_router.get("/{file_id}", status_code=status.HTTP_200_OK)
def get_file_by_id(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get/download a file by id (GET /api/v1/files/{file_id})."""
    file_obj, _ = _get_file_and_check_auth(file_id, db, current_user)
    full_path = UPLOAD_BASE_DIR / file_obj.filepath
    if not full_path.exists():
        logger.error(f"File not found on disk: {full_path}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")
    return StarletteFileResponse(path=full_path, filename=file_obj.filename, media_type=file_obj.content_type)


@files_by_id_router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file_by_id(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a file by id (DELETE /api/v1/files/{file_id}). Only uploader or task owner can delete."""
    file_obj, _ = _get_file_and_check_auth(file_id, db, current_user)
    file_service.soft_delete_file(db, file_obj)


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a file. Only uploader or task owner can delete."""
    file_obj = db.query(FileModel).filter(
        FileModel.id == file_id,
        FileModel.is_deleted == False
    ).first()
    
    if not file_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    # Check authorization
    task = db.query(Task).filter(Task.id == file_obj.task_id).first()
    if not task or (task.owner_id != current_user.id and file_obj.uploaded_by != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this file")
    
    file_service.soft_delete_file(db, file_obj)
