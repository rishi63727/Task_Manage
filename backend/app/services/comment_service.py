"""Comment service for business logic."""
import logging

from sqlalchemy.orm import Session

from app.models.comment import Comment

logger = logging.getLogger(__name__)


def create_comment(
    db: Session,
    task_id: int,
    user_id: int,
    content: str
) -> Comment:
    """Create a new comment."""
    comment = Comment(
        task_id=task_id,
        user_id=user_id,
        content=content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    logger.info(f"Comment {comment.id} created on task {task_id}")
    return comment


def update_comment(
    db: Session,
    comment: Comment,
    content: str
) -> Comment:
    """Update a comment."""
    comment.content = content
    db.commit()
    db.refresh(comment)
    logger.info(f"Comment {comment.id} updated")
    return comment


def soft_delete_comment(db: Session, comment: Comment) -> None:
    """Soft delete a comment."""
    comment.is_deleted = True
    db.commit()
    logger.info(f"Comment {comment.id} soft deleted")


def get_task_comments(
    db: Session,
    task_id: int,
    limit: int = 50,
    offset: int = 0
):
    """Get all non-deleted comments for a task."""
    return db.query(Comment).filter(
        Comment.task_id == task_id,
        Comment.is_deleted == False
    ).order_by(Comment.created_at.desc()).offset(offset).limit(limit).all()
