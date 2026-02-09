"""
Alembic environment: uses app.database and .env for DATABASE_URL.
Run from backend/: alembic upgrade head, alembic revision --autogenerate -m "message"
"""
import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import pool
from alembic import context

# Load .env from backend/ (where we run alembic)
load_dotenv()

# Alembic Config object
config = context.config

# Logging from alembic.ini
if config.config_file_name:
    fileConfig(config.config_file_name)

# Use same DB URL as the app (from .env or default)
database_url = os.getenv("DATABASE_URL") or "sqlite:///./app.db"
config.set_main_option("sqlalchemy.url", database_url)

# Import Base and all models so target_metadata has every table
from app.database import Base
from app.models import user, task, comment, file  # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode: generate SQL only, no DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode: connect to DB and apply migrations."""
    from sqlalchemy import create_engine

    kwargs = {"poolclass": pool.NullPool}
    if database_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    connectable = create_engine(database_url, **kwargs)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
