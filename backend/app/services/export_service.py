"""Export service for tasks."""
import csv
import io
import json
import logging
from typing import BinaryIO, List

from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskResponse

logger = logging.getLogger(__name__)


def export_tasks_csv(tasks: List[Task]) -> str:
    """Export tasks as CSV format."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers (lowercase to match test expectations)
    headers = [
        "id",
        "title",
        "description",
        "priority",
        "completed",
        "owner_id",
        "created_at",
        "updated_at",
        "completed_at"
    ]
    writer.writerow(headers)
    
    # Rows
    for task in tasks:
        writer.writerow([
            task.id,
            task.title,
            task.description or "",
            task.priority,
            "True" if task.completed else "False",
            task.owner_id,
            task.created_at.isoformat(),
            task.updated_at.isoformat(),
            task.completed_at.isoformat() if task.completed_at else ""
        ])
    
    logger.info(f"Exported {len(tasks)} tasks to CSV")
    return output.getvalue()


def export_tasks_json(tasks: List[Task]) -> str:
    """Export tasks as JSON format."""
    tasks_data = []
    for task in tasks:
        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
            "completed_at": task.completed_at.isoformat() if task.completed_at else None
        })
    
    logger.info(f"Exported {len(tasks)} tasks to JSON")
    return json.dumps(tasks_data, indent=2)
