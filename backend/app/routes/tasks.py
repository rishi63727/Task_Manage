import json
from typing import List, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate, BulkTaskCreate, BulkTaskResponse, _normalize_status as normalize_status
from app.services import task_service
from app.services.websocket_manager import manager
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["Tasks"], redirect_slashes=False)


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
    from datetime import datetime

    if task.assigned_to is not None:
        assigned_user = db.query(User).filter(User.id == task.assigned_to).first()
        if not assigned_user:
            raise HTTPException(status_code=400, detail="Assigned user not found")

    status_value = normalize_status(task.status or "todo")
    completed_value = status_value == "done"
    completed_at = datetime.utcnow() if completed_value else None
    tags_json = json.dumps(task.tags) if task.tags is not None else None
    new_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority or "medium",
        status=status_value,
        completed=completed_value,
        completed_at=completed_at,
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
    logger.info("GET /tasks params: status=%r priority=%r", status, priority)

    query = db.query(Task).filter(Task.owner_id == current_user.id, Task.is_deleted == False)

    if q and q.strip():
        from sqlalchemy import or_
        term = f"%{q.strip()}%"
        query = query.filter(or_(Task.title.ilike(term), Task.description.ilike(term)))
    if priority and priority.strip():
        query = query.filter(Task.priority == priority.strip().lower())
    if status and status.strip():
        status_val = normalize_status(status.strip())
        if status_val in ("todo", "in_progress", "done"):
            query = query.filter(Task.status == status_val)

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

    # Handle status update - status is the single source of truth
    # Use model_fields_set so we apply status when client explicitly sent it (even if value was normalized)
    if "status" in task_update.model_fields_set and task_update.status is not None:
        new_status = normalize_status(str(task_update.status))
        current_status = normalize_status(str(task.status or "todo"))

        if current_status != new_status:
            task.status = new_status
            updated = True
            logger.info("Task %s status: %s -> %s", task_id, current_status, new_status)

        # Derive completed from status
        if task.status == "done":
            if not task.completed:
                task.completed = True
                updated = True
            if task.completed_at is None:
                task.completed_at = datetime.utcnow()
                updated = True
        else:
            if task.completed:
                task.completed = False
                updated = True
            if task.completed_at is not None:
                task.completed_at = None
                updated = True
    elif task_update.status is not None:
        # Client sent status in body but it wasn't in model_fields_set (edge case); still apply
        new_status = normalize_status(str(task_update.status))
        current_status = normalize_status(str(task.status or "todo"))
        if current_status != new_status:
            task.status = new_status
            updated = True
            if task.status == "done":
                task.completed = True
                task.completed_at = task.completed_at or datetime.utcnow()
            else:
                task.completed = False
                task.completed_at = None

    # Handle other fields
    if task_update.title is not None:
        task.title = task_update.title
        updated = True
    if task_update.description is not None:
        task.description = task_update.description
        updated = True
    if task_update.priority is not None:
        task.priority = task_update.priority
        updated = True
    if "due_date" in task_update.model_fields_set:
        task.due_date = task_update.due_date
        updated = True
    if "tags" in task_update.model_fields_set:
        task.tags = json.dumps(task_update.tags) if task_update.tags is not None else None
        updated = True
    if "assigned_to" in task_update.model_fields_set:
        if task_update.assigned_to is not None:
            assigned_user = db.query(User).filter(User.id == task_update.assigned_to).first()
            if not assigned_user:
                raise HTTPException(status_code=400, detail="Assigned user not found")
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
        if task.completed and task.completed_at:
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
