"""Analytics router for reporting."""
import logging
from typing import List

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import TaskSummary, UserPerformance, TaskTrends
from app.services import analytics_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/tasks/summary", response_model=TaskSummary, status_code=status.HTTP_200_OK)
def get_task_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get task summary for current user (count by status and priority)."""
    summary = analytics_service.get_task_summary(db, current_user.id)
    return summary


@router.get("/summary", response_model=TaskSummary, status_code=status.HTTP_200_OK)
def get_task_summary_alias(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Compatibility alias for task summary endpoint."""
    return get_task_summary(db=db, current_user=current_user)


@router.get("/users/performance", response_model=List[UserPerformance], status_code=status.HTTP_200_OK)
def get_user_performance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get performance metrics for all users (tasks assigned, completed, completion rate, avg time)."""
    return analytics_service.get_user_performance(db)


@router.get("/tasks/trends", response_model=TaskTrends, status_code=status.HTTP_200_OK)
def get_task_trends(
    days: int = Query(30),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get daily task creation and completion trends."""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="days must be between 1 and 365")
    trends = analytics_service.get_task_trends(db, days)
    return TaskTrends(daily_trends=trends)
