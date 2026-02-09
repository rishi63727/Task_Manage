from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str


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
