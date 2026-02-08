from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


# String constants for priority (used by tests and schemas); DB stores plain strings
class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    low = "low"
    medium = "medium"
    high = "high"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    priority = Column(String, nullable=False, default="medium", index=True)
    status = Column(String, nullable=False, default="todo", index=True)  # todo, in_progress, done
    due_date = Column(DateTime, nullable=True)
    tags = Column(String, nullable=True)  # JSON array string e.g. ["tag1","tag2"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="tasks", foreign_keys=[owner_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    files = relationship("File", back_populates="task", cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_tasks_owner_id', 'owner_id'),
        Index('ix_tasks_completed', 'completed'),
        Index('ix_tasks_created_at', 'created_at'),
        Index('ix_tasks_status', 'status'),
        Index('ix_tasks_due_date', 'due_date'),
    )

