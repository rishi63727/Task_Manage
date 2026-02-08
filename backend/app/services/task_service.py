"""Task service for business logic."""
import json
import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, BulkTaskCreate

logger = logging.getLogger(__name__)


def create_bulk_tasks(
    db: Session, 
    bulk_create: BulkTaskCreate, 
    current_user
) -> List[Task]:
    """Create multiple tasks in a single transaction."""
    try:
        created_tasks = []
        for task_data in bulk_create.tasks:
            if task_data.assigned_to is not None:
                assigned_user = db.query(User).filter(User.id == task_data.assigned_to).first()
                if not assigned_user:
                    raise ValueError("Assigned user not found")
            status_value = task_data.status or "todo"
            completed_value = status_value == "done"
            completed_at = datetime.utcnow() if completed_value else None
            tags_json = json.dumps(task_data.tags) if task_data.tags is not None else None
            task = Task(
                title=task_data.title,
                description=task_data.description,
                priority=task_data.priority or "medium",
                status=status_value,
                completed=completed_value,
                completed_at=completed_at,
                due_date=task_data.due_date,
                tags=tags_json,
                assigned_to=task_data.assigned_to,
                owner_id=current_user.id
            )
            db.add(task)
            created_tasks.append(task)
        
        db.commit()
        for task in created_tasks:
            db.refresh(task)
        
        logger.info(
            f"Bulk created {len(created_tasks)} tasks for user {current_user.id}"
        )
        return created_tasks
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating bulk tasks: {str(e)}")
        raise


def mark_task_completed(db: Session, task: Task) -> Task:
    """Mark a task as completed and set completed_at timestamp."""
    task.completed = True
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    logger.info(f"Task {task.id} marked as completed")
    return task


def get_user_tasks_for_date_range(
    db: Session,
    user_id: int,
    start_date: datetime,
    end_date: datetime
) -> List[Task]:
    """Get tasks created within a date range."""
    return db.query(Task).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False,
        Task.created_at >= start_date,
        Task.created_at <= end_date
    ).all()


def get_completed_tasks_for_date_range(
    db: Session,
    user_id: int,
    start_date: datetime,
    end_date: datetime
) -> List[Task]:
    """Get completed tasks within a date range."""
    return db.query(Task).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False,
        Task.completed == True,
        Task.completed_at >= start_date,
        Task.completed_at <= end_date
    ).all()
