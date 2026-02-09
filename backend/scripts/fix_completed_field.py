"""
One-time script to sync the 'completed' field with the 'status' field.
Sets completed = True where status = 'done', completed = False otherwise.

Usage: python scripts/fix_completed_field.py
"""
from app.database import SessionLocal


def fix_completed_field():
    """Sync completed field based on status field."""
    db = SessionLocal()
    try:
        # Update completed field based on status
        result = db.execute(
            "UPDATE tasks SET completed = (status = 'done')"
        )
        db.commit()
        
        # Get count of affected rows
        affected = result.rowcount if hasattr(result, 'rowcount') else 'unknown'
        print(f"✅ Successfully updated {affected} tasks")
        print("✅ completed field is now in sync with status field")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating tasks: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🔧 Fixing 'completed' field to match 'status' field...")
    fix_completed_field()
    print("✅ Done!")
