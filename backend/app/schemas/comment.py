from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.utils.sanitize import sanitize_text


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str

    @field_validator("content", mode="after")
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        return sanitize_text(v, max_length=10_000) if v else ""


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str

    @field_validator("content", mode="after")
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        return sanitize_text(v, max_length=10_000) if v else ""


class CommentResponse(BaseModel):
    """Schema for comment response."""
    id: int
    content: str
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CommentListResponse(CommentResponse):
    """Extended response with user info for list endpoints."""
    pass
