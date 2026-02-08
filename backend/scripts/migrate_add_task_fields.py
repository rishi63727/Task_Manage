"""
Add status, due_date, tags, assigned_to to tasks table if missing.
Run from backend dir: python scripts/migrate_add_task_fields.py
Uses DATABASE_URL from environment (or .env).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not set. Set it in .env or environment.")
    sys.exit(1)

# SQLite: add columns if not exist (SQLite doesn't support IF NOT EXISTS for columns; we use try/except or check schema)
if "sqlite" in DATABASE_URL:
    import sqlite3
    # Extract path from sqlite:///path
    path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(tasks)")
    cols = {row[1] for row in cur.fetchall()}
    for col, sql in [
        ("status", "ALTER TABLE tasks ADD COLUMN status VARCHAR DEFAULT 'todo'"),
        ("due_date", "ALTER TABLE tasks ADD COLUMN due_date DATETIME"),
        ("tags", "ALTER TABLE tasks ADD COLUMN tags VARCHAR"),
        ("assigned_to", "ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id)"),
    ]:
        if col not in cols:
            try:
                cur.execute(sql)
                print(f"Added column: {col}")
            except Exception as e:
                print(f"Skip {col}: {e}")
        else:
            print(f"Column already exists: {col}")
    conn.commit()
    conn.close()
    print("Migration done.")
else:
    print("Only SQLite migration is implemented. For PostgreSQL/MySQL add columns manually or use Alembic.")
