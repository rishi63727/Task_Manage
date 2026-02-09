#!/usr/bin/env python3
"""
One-time script to fix completed field based on status.
Run this once after implementing the status-as-truth model.
"""

from app.database import SessionLocal

def main():
    db = SessionLocal()
    try:
        # Update completed based on status
        result = db.execute("UPDATE tasks SET completed = (status = 'done')")
        db.commit()
        print(f"Updated {result.rowcount} tasks to sync completed with status.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
