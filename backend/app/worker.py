import asyncio
from app.core.celery_app import celery_app
from app.services.email_service import send_simple_email
from asgiref.sync import async_to_sync

@celery_app.task(acks_late=True)
def send_email_task(email_to: str, subject: str, body: str):
    """
    Celery task to send email.
    Since send_simple_email is async, we need to run it synchronously here.
    """
    async_to_sync(send_simple_email)(subject, email_to, body)
