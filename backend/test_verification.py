"""Verification tests for Single-Source-of-Truth Status Model."""
import requests
from sqlalchemy import text
from app.database import SessionLocal

# Test 1: Schema Rejection
print("=" * 60)
print("TEST 1: Schema Rejection - Attempting to send 'completed'")
print("=" * 60)

# First, get a valid token (you'll need to update this with your credentials)
login_url = "http://localhost:8000/api/v1/auth/login"
login_data = {
    "username": "test@example.com",  # Update with your test user
    "password": "testpassword"        # Update with your test password
}

try:
    # Login to get token
    login_response = requests.post(login_url, data=login_data)
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to update task with 'completed' field
        update_url = "http://localhost:8000/api/v1/tasks/1"
        payload = {"completed": True}
        
        response = requests.put(update_url, json=payload, headers=headers)
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 422:
            print("\n✅ PASS: Schema correctly rejects 'completed' field!")
        else:
            print("\n❌ FAIL: Schema should reject 'completed' field with 422 error")
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print("Please update credentials in the script")
except Exception as e:
    print(f"❌ Error during API test: {e}")
    print("Make sure backend is running on http://localhost:8000")

# Test 2: Database Invariant
print("\n" + "=" * 60)
print("TEST 2: Database Invariant - Checking data consistency")
print("=" * 60)

db = SessionLocal()
try:
    result = db.execute(text("""
        SELECT COUNT(*) as inconsistent_count
        FROM tasks
        WHERE (status = 'done' AND completed = false)
           OR (status != 'done' AND completed = true)
    """))
    
    row = result.fetchone()
    inconsistent_count = row[0]
    
    print(f"\nInconsistent records: {inconsistent_count}")
    
    if inconsistent_count == 0:
        print("✅ PASS: Database invariant holds! All data is consistent.")
    else:
        print(f"❌ FAIL: Found {inconsistent_count} inconsistent records")
        print("Run the migration script to fix this:")
        print("  venv\\Scripts\\python.exe migrations\\sync_completed_field.py")
        
        # Show sample inconsistent records
        sample = db.execute(text("""
            SELECT id, title, status, completed
            FROM tasks
            WHERE (status = 'done' AND completed = false)
               OR (status != 'done' AND completed = true)
            LIMIT 5
        """))
        
        print("\nSample inconsistent records:")
        for record in sample:
            print(f"  ID {record.id}: status={record.status}, completed={record.completed}")
    
except Exception as e:
    print(f"❌ Error during database test: {e}")
finally:
    db.close()

print("\n" + "=" * 60)
print("Verification Complete")
print("=" * 60)
