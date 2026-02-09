"""
Background job functions for FastAPI BackgroundTasks.
All jobs MUST be sync. They run after the response is sent; no blocking, no Celery/Redis.
"""
import asyncio
import logging

from app.services.email_service import send_simple_email

logger = logging.getLogger(__name__)


def send_task_assigned_email(email: str, task_title: str) -> None:
    """Run after task create when assigned_to is set. Sync wrapper for BackgroundTasks."""
    logger.info("[BG] Sending task assigned email to %s", email)
    asyncio.run(
        send_simple_email(
            subject="New Task Assigned 📌",
            email_to=email,
            body=f"""
            <h2>New Task Assigned</h2>
            <p>You have been assigned a new task:</p>
            <p><strong>{task_title}</strong></p>
            """,
        )
    )


def send_task_completed_email(email: str, task_title: str) -> None:
    """Run after task status update when status becomes done. Sync wrapper for BackgroundTasks."""
    logger.info("[BG] Sending task completed email to %s", email)
    asyncio.run(
        send_simple_email(
            subject="Task Completed 🎉",
            email_to=email,
            body=f"""
            <h2>Task Completed</h2>
            <p>You successfully completed:</p>
            <p><strong>{task_title}</strong></p>
            """,
        )
    )
