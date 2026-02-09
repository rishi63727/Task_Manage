"""Analytics service for reporting."""
import logging
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List

from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import TaskSummary, UserPerformance, DailyTrend


def generate_date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)

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
        Task.status == "done"
    ).scalar() or 0

    # Pending tasks
    pending = total - completed

    # Overdue tasks (not done and past due date)
    overdue = db.query(func.count(Task.id)).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False,
        Task.status != "done",
        Task.due_date != None,
        Task.due_date < datetime.utcnow()
    ).scalar() or 0
    
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

    status_counts = db.query(
        Task.status,
        func.count(Task.id)
    ).filter(
        Task.owner_id == user_id,
        Task.is_deleted == False
    ).group_by(Task.status).all()

    by_status = {"todo": 0, "in_progress": 0, "done": 0}
    for s, count in status_counts:
        by_status[s] = count
    
    return TaskSummary(
        total=total,
        completed=completed,
        pending=pending,
        overdue=overdue,
        by_priority=by_priority,
        by_status=by_status
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
            Task.status == "done"
        ).scalar() or 0
        
        # Completion rate
        completion_rate = (completed / total_assigned * 100) if total_assigned > 0 else 0
        
        # Average completion time
        completed_tasks = db.query(Task.completed_at, Task.created_at).filter(
            Task.owner_id == user.id,
            Task.is_deleted == False,
            Task.status == "done",
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
    """Get daily task creation and completion trends (one entry per day, zeros included)."""
    # Use UTC so range is consistent regardless of server timezone
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)  # Include today

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.min.time())

    # Fetch tasks that were either created in range OR completed in range
    # (so we count completions for tasks created before the range)
    tasks = db.query(Task).filter(
        Task.is_deleted == False,
        or_(
            and_(
                Task.created_at >= start_dt,
                Task.created_at < end_dt + timedelta(days=1),
            ),
            and_(
                Task.completed_at.isnot(None),
                Task.completed_at >= start_dt,
                Task.completed_at < end_dt + timedelta(days=1),
            ),
        ),
    ).all()

    # Aggregate by date (use .date() for timezone-naive UTC dates)
    created_map = defaultdict(int)
    completed_map = defaultdict(int)

    for task in tasks:
        created_day = task.created_at.date()
        if start_date <= created_day <= end_date:
            created_map[created_day] += 1
        if task.completed_at:
            completed_day = task.completed_at.date()
            if start_date <= completed_day <= end_date:
                completed_map[completed_day] += 1

    # Build continuous series: one entry per day, including zeros
    trends = []
    for day in generate_date_range(start_date, end_date):
        trends.append(
            DailyTrend(
                date=day,
                tasks_created=created_map.get(day, 0),
                tasks_completed=completed_map.get(day, 0),
            )
        )
    return trends
