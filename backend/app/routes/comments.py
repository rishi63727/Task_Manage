"""Comments router for task comments."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.comment import Comment
from app.models.task import Task
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.services import comment_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Comments"])


@router.post("/tasks/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a comment on a task. Only task owner and assigned users can comment."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Allow task owner or assigned users to comment
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to comment on this task")
    
    comment = comment_service.create_comment(
        db,
        task_id=task_id,
        user_id=current_user.id,
        content=comment_data.content
    )
    
    return comment


@router.get("/tasks/{task_id}/comments",response_model=list[CommentResponse], status_code=status.HTTP_200_OK)
def list_comments(
    task_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all comments on a task. Only task owner or assigned users can view."""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.is_deleted == False
    ).first()
    
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Allow task owner to read all comments
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view comments")
    
    comments = comment_service.get_task_comments(db, task_id, limit, offset)
    return comments


@router.put("/comments/{comment_id}", response_model=CommentResponse, status_code=status.HTTP_200_OK)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a comment. Only comment owner can update."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only comment owner can update")
    
    updated_comment = comment_service.update_comment(db, comment, comment_data.content)
    return updated_comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a comment. Only comment owner can delete."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only comment owner can delete")
    
    comment_service.soft_delete_comment(db, comment)
