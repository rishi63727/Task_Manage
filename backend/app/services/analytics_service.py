"""Analytics service for reporting."""
import logging
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import TaskSummary, UserPerformance, DailyTrend

logger = logging.getLogger(__name__)


def get_task_summary(db: Session, user_id: int) -> TaskSummary:
    """Get task summary for a user."""
    # Total tasks
    total = db.query(func.count(Task.id)).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False
    ).scalar() or 0
    
    # Completed tasks
    completed = db.query(func.count(Task.id)).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False,
        Task.completed == True
    ).scalar() or 0
    
    # Pending tasks
    pending = total - completed
    
    # By priority (string: "low" | "medium" | "high")
    priority_counts = db.query(
        Task.priority,
        func.count(Task.id)
    ).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False
    ).group_by(Task.priority).all()
    
    by_priority = {"low": 0, "medium": 0, "high": 0}
    for p, count in priority_counts:
        by_priority[p] = count
    
    return TaskSummary(
        total=total,
        completed=completed,
        pending=pending,
        by_priority=by_priority
    )


def get_user_performance(db: Session) -> List[UserPerformance]:
    """Get performance metrics for all users."""
    users = db.query(User).all()
    performance_list = []
    
    for user in users:
        # Tasks assigned
        total_assigned = db.query(func.count(Task.id)).filter(
            Task.owner_id == user.id,
            Task.is_deleted == False
        ).scalar() or 0
        
        # Tasks completed
        completed = db.query(func.count(Task.id)).filter(
            Task.owner_id == user.id,
            Task.is_deleted == False,
            Task.completed == True
        ).scalar() or 0
        
        # Completion rate
        completion_rate = (completed / total_assigned * 100) if total_assigned > 0 else 0
        
        # Average completion time
        completed_tasks = db.query(Task.completed_at, Task.created_at).filter(
            Task.owner_id == user.id,
            Task.is_deleted == False,
            Task.completed == True,
            Task.completed_at != None
        ).all()
        
        avg_hours = None
        if completed_tasks:
            total_seconds = sum(
                (task[0] - task[1]).total_seconds()
                for task in completed_tasks
            )
            avg_hours = (total_seconds / len(completed_tasks)) / 3600
        
        performance_list.append(
            UserPerformance(
                user_id=user.id,
                email=user.email,
                tasks_assigned=total_assigned,
                tasks_completed=completed,
                completion_rate=round(completion_rate, 2),
                avg_completion_time_hours=round(avg_hours, 2) if avg_hours else None
            )
        )
    
    return performance_list


def get_task_trends(db: Session, days: int = 30) -> List[DailyTrend]:
    """Get daily task creation and completion trends."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Raw query for aggregation
    created_query = db.query(
        func.date(Task.created_at).label('date'),
        func.count(Task.id).label('count')
    ).filter(
        Task.is_deleted == False,
        Task.created_at >= start_date
    ).group_by(func.date(Task.created_at)).all()
    
    completed_query = db.query(
        func.date(Task.completed_at).label('date'),
        func.count(Task.id).label('count')
    ).filter(
        Task.is_deleted == False,
        Task.completed == True,
        Task.completed_at != None,
        Task.completed_at >= start_date
    ).group_by(func.date(Task.completed_at)).all()
    
    # Build dict for merging
    trends_dict = {}
    for date, count in created_query:
        if date not in trends_dict:
            trends_dict[date] = DailyTrend(date=date, tasks_created=0, tasks_completed=0)
        trends_dict[date].tasks_created = count
    
    for date, count in completed_query:
        if date not in trends_dict:
            trends_dict[date] = DailyTrend(date=date, tasks_created=0, tasks_completed=0)
        trends_dict[date].tasks_completed = count
    
    return sorted(trends_dict.values(), key=lambda x: x.date)
