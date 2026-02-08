from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TaskSummary(BaseModel):
    """Analytics summary for tasks."""
    total: int
    completed: int
    pending: int
    by_priority: dict  # {"low": count, "medium": count, "high": count}
    by_status: dict = {}  # {"todo": count, "in_progress": count, "done": count}


class UserPerformance(BaseModel):
    """Performance metrics for a user."""
    user_id: int
    email: str
    tasks_assigned: int
    tasks_completed: int
    completion_rate: float  # 0-100
    avg_completion_time_hours: Optional[float] = None


class DailyTrend(BaseModel):
    """Daily trend data."""
    date: datetime
    tasks_created: int
    tasks_completed: int


class TaskTrends(BaseModel):
    """Trend data for tasks."""
    daily_trends: List[DailyTrend]

