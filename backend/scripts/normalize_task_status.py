"""
One-time DB cleanup: normalize task.status to todo | in_progress | done.
Fixes legacy values like "To Do", "IN_PROGRESS", "in-progress", etc.

Run from backend dir: python scripts/normalize_task_status.py
Uses app database (DATABASE_URL from .env or default app.db).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

# Same logic as app.schemas.task
def normalize_status(value: str) -> str:
    v = (value or "").strip().lower().replace("-", "_")
    if v in ("todo", "in_progress", "done"):
        return v
    if v in ("to_do", "to do"):
        return "todo"
    if v in ("in progress",):
        return "in_progress"
    return "todo"  # fallback for unknown


def main():
    from app.database import SessionLocal
    from app.models.task import Task

    db = SessionLocal()
    try:
        tasks = db.query(Task).all()
        updated = 0
        for task in tasks:
            normalized = normalize_status(task.status or "todo")
            if (task.status or "") != normalized:
                task.status = normalized
                updated += 1
                print(f"  task id={task.id}: {task.status!r} -> {normalized!r}")
        if updated:
            db.commit()
            print(f"Normalized {updated} task(s).")
        else:
            print("All task statuses already normalized.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
