"""Sync email sending via SMTP. No-op if SMTP is not configured (e.g. dev)."""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_content: str) -> None:
    """
    Send an HTML email. Does nothing if SMTP is not configured (missing env vars).
    """
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        logger.warning("SMTP not configured (missing SMTP_HOST/USERNAME/PASSWORD/EMAIL_FROM). Skipping email.")
        return

    logger.info("SMTP HOST=%s USER=%s", settings.SMTP_HOST, settings.SMTP_USERNAME)

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info("EMAIL SENT SUCCESSFULLY to %s: %s", to_email, subject)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
