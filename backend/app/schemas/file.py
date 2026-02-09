from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FileResponse(BaseModel):
    """Schema for file response."""
    id: int
    filename: str
    filepath: str
    size: int
    content_type: str
    task_id: int
    uploaded_by: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class FileListResponse(FileResponse):
    """Extended response for file list endpoints."""
    pass
