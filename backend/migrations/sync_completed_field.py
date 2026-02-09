"""One-time migration to sync completed field with status field.

This script ensures data consistency after implementing the single-source-of-truth status model.
Run this once during deployment.
"""
from sqlalchemy import text
from app.database import SessionLocal


def sync_completed_field():
    """Sync completed field based on status field for all existing tasks."""
    db = SessionLocal()
    try:
        # Update completed field based on status
        db.execute(text("""
            UPDATE tasks
            SET completed = (status = 'done')
        """))
        
        # Update completed_at for tasks that are done but don't have completed_at set
        db.execute(text("""
            UPDATE tasks
            SET completed_at = updated_at
            WHERE status = 'done' 
              AND completed_at IS NULL
        """))
        
        # Clear completed_at for tasks that are not done
        db.execute(text("""
            UPDATE tasks
            SET completed_at = NULL
            WHERE status != 'done' 
              AND completed_at IS NOT NULL
        """))
        
        db.commit()
        
        # Verify the migration
        result = db.execute(text("""
            SELECT 
                status,
                COUNT(*) as total,
                SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as has_completed_at
            FROM tasks
            WHERE is_deleted = false
            GROUP BY status
        """))
        
        print("\nMigration verification:")
        print("Status | Total | Completed | Has completed_at")
        print("-" * 50)
        for row in result:
            print(f"{row.status:12} | {row.total:5} | {row.completed_count:9} | {row.has_completed_at:16}")
        
        print("\nMigration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    sync_completed_field()
