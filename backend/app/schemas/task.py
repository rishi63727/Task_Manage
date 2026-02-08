import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"  # low, medium, high
    status: Optional[str] = "todo"  # todo, in_progress, done
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[int] = None


class BulkTaskCreate(BaseModel):
    """Schema for bulk task creation."""
    tasks: List[TaskCreate]


class TaskResponse(BaseModel):
    """Schema for task response in API replies."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    completed: bool
    priority: str
    status: str
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    owner_id: int
    assigned_to: Optional[int] = None

    @field_validator("tags", mode="before")
    @classmethod
    def parse_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            if not v.strip():
                return None
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [t.strip() for t in v.split(",") if t.strip()]
        return None


class BulkTaskResponse(BaseModel):
    """Schema for bulk task creation response."""
    created: int
    tasks: List[TaskResponse]


class TaskUpdate(BaseModel):
    """Schema for updating an existing task. All fields are optional."""
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[int] = None

