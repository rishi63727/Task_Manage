import json
from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, BulkTaskCreate, BulkTaskResponse
from app.services import task_service
from app.services.websocket_manager import manager
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"])


@router.post(
    "/bulk",
    response_model=BulkTaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_bulk_tasks(
    bulk_create: BulkTaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create multiple tasks in a single transaction. Validates all input before creating."""
    if not bulk_create.tasks:
        raise HTTPException(status_code=400, detail="At least one task is required")
    
    try:
        created_tasks = task_service.create_bulk_tasks(db, bulk_create, current_user)
        return BulkTaskResponse(created=len(created_tasks), tasks=created_tasks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating bulk tasks: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create tasks"
        )


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    task: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a new task for the authenticated user. Returns 201 on success."""
    tags_json = json.dumps(task.tags) if task.tags else None
    new_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority or "medium",
        status=task.status or "todo",
        due_date=task.due_date,
        tags=tags_json,
        assigned_to=task.assigned_to,
        owner_id=current_user.id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    background_tasks.add_task(
        manager.broadcast,
        {
            "type": "TASK_CREATED",
            "payload": TaskResponse.model_validate(new_task).model_dump(mode="json")
        }
    )

    return new_task


@router.get(
    "/",
    response_model=List[TaskResponse],
    status_code=status.HTTP_200_OK
)
def list_tasks(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    q: Optional[str] = Query(None, description="Search in title and description"),
    completed: Optional[bool] = Query(
        None, description="Filter by completion status"
    ),
    priority: Optional[str] = Query(
        None, description="Filter by priority (low, medium, high)"
    ),
    status: Optional[str] = Query(
        None, description="Filter by status (todo, in_progress, done)"
    ),
    limit: int = Query(
        10, ge=1, le=100, description="Maximum number of items to return"
    ),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    sort_by: Optional[str] = Query(
        "created_at", description="Sort field: created_at, updated_at, due_date, priority, title"
    ),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
):
    """Retrieve tasks for the authenticated user with optional filtering, search, sorting and pagination."""
    query = db.query(Task).filter(Task.owner_id == current_user.id, Task.is_deleted == False)

    if q and q.strip():
        from sqlalchemy import or_
        term = f"%{q.strip()}%"
        query = query.filter(or_(Task.title.ilike(term), Task.description.ilike(term)))
    if completed is not None:
        query = query.filter(Task.completed == completed)
    if priority:
        query = query.filter(Task.priority == priority)
    if status:
        query = query.filter(Task.status == status)

    sort_columns = {"created_at": Task.created_at, "updated_at": Task.updated_at, "due_date": Task.due_date, "priority": Task.priority, "title": Task.title}
    sort_col = sort_columns.get(sort_by, Task.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    tasks = query.offset(offset).limit(limit).all()
    return tasks


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve a single task by id. Returns 404 if missing, 403 if not owned by user."""
    task = db.query(Task).filter(Task.id == task_id, Task.is_deleted == False).first()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this task")

    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK
)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a task owned by current user. Returns 404 if not found, 403 if not authorized, 200 on success."""
    from datetime import datetime
    
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.owner_id == current_user.id, Task.is_deleted == False)
        .first()
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    updated = False
    if task_update.title is not None:
        task.title = task_update.title
        updated = True
    if task_update.description is not None:
        task.description = task_update.description
        updated = True
    if task_update.completed is not None:
        task.completed = task_update.completed
        if task_update.completed and not task.completed_at:
            task.completed_at = datetime.utcnow()
        updated = True
    if task_update.priority is not None:
        task.priority = task_update.priority
        updated = True
    if task_update.status is not None:
        task.status = task_update.status
        updated = True
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
        updated = True
    if task_update.tags is not None:
        task.tags = json.dumps(task_update.tags)
        updated = True
    if task_update.assigned_to is not None:
        task.assigned_to = task_update.assigned_to
        updated = True

    if updated:
        db.commit()
        db.refresh(task)
        
        background_tasks.add_task(
            manager.broadcast,
            {
                "type": "TASK_UPDATED",
                "payload": TaskResponse.model_validate(task).model_dump(mode="json")
            }
        )
        
        # Send email if task is completed (optional: requires Celery/worker)
        if task_update.completed and task.completed:
            try:
                from app.worker import send_email_task
                send_email_task.delay(
                    email_to=current_user.email,
                    subject=f"Task Completed: {task.title}",
                    body=f"<h1>Task Completed</h1><p>You have completed the task: <strong>{task.title}</strong></p>"
                )
            except ImportError:
                pass

    return task


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Soft-delete a task owned by current user. Returns 404 if not found, 403 if not authorized, 204 on success."""
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.owner_id == current_user.id, Task.is_deleted == False)
        .first()
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Soft delete: mark the task as deleted instead of removing the row.
    # Soft delete: mark the task as deleted instead of removing the row.
    task.is_deleted = True
    db.commit()

    background_tasks.add_task(
        manager.broadcast,
        {
            "type": "TASK_DELETED",
            "payload": {"id": task_id}
        }
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
