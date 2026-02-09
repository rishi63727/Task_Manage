"""Export router for tasks export."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, status, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.services import export_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["Export"])


@router.get("/export", status_code=status.HTTP_200_OK)
def export_tasks(
    format: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Export user's tasks as CSV or JSON."""
    if format is None or format == "":
        raise HTTPException(status_code=400, detail="Format is required (csv or json)")
    if format not in ["csv", "json"]:
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'json'")
    
    # Build query
    query = db.query(Task).filter(
        Task.owner_id == current_user.id,
        Task.is_deleted == False
    )
    
    # Single source of truth: filter by status, not completed
    if completed is not None:
        if completed:
            query = query.filter(Task.status == "done")
        else:
            query = query.filter(Task.status != "done")
    
    if priority:
        query = query.filter(Task.priority == priority)
    
    tasks = query.order_by(Task.created_at.asc()).offset(offset).limit(limit).all()
    
    if format == "csv":
        csv_content = export_service.export_tasks_csv(tasks)
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=tasks_export.csv"}
        )
    else:  # json
        json_content = export_service.export_tasks_json(tasks)
        return StreamingResponse(
            iter([json_content]),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=tasks_export.json"}
        )
