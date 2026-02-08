import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


ALLOWED_PRIORITIES = {"low", "medium", "high"}
ALLOWED_STATUSES = {"todo", "in_progress", "done"}


def _normalize_status(value: str) -> str:
    return value.strip().lower().replace("-", "_")


def _normalize_priority(value: str) -> str:
    return value.strip().lower()


def _normalize_tags(tags: Optional[List[str]]) -> Optional[List[str]]:
    if tags is None:
        return None
    cleaned = [t.strip() for t in tags if t and t.strip()]
    return cleaned


class TaskCreate(BaseModel):
    """Schema for creating a new task."""
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"  # low, medium, high
    status: Optional[str] = "todo"  # todo, in_progress, done
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[int] = None

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v):
        if v is None:
            return v
        value = _normalize_priority(str(v))
        if value not in ALLOWED_PRIORITIES:
            raise ValueError("priority must be one of: low, medium, high")
        return value

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return v
        value = _normalize_status(str(v))
        if value not in ALLOWED_STATUSES:
            raise ValueError("status must be one of: todo, in_progress, done")
        return value

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = [t.strip() for t in v.split(",")]
        if isinstance(v, list):
            return _normalize_tags(v)
        raise ValueError("tags must be a list of strings")


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

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v):
        if v is None:
            return v
        value = _normalize_priority(str(v))
        if value not in ALLOWED_PRIORITIES:
            raise ValueError("priority must be one of: low, medium, high")
        return value

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        if v is None:
            return v
        value = _normalize_status(str(v))
        if value not in ALLOWED_STATUSES:
            raise ValueError("status must be one of: todo, in_progress, done")
        return value

    @field_validator("tags", mode="before")
    @classmethod
    def validate_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = [t.strip() for t in v.split(",")]
        if isinstance(v, list):
            return _normalize_tags(v)
        raise ValueError("tags must be a list of strings")
