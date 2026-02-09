"""App configuration from environment. SMTP settings are optional (e.g. for dev without email)."""
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Settings loaded from .env. Prefix with APP_ or set in .env without prefix."""

    # SMTP (optional – omit in dev to skip sending email).
    # Gmail: use App Password (16 chars, no spaces) in SMTP_PASSWORD.
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
