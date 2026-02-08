import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.utils.auth import hash_password, create_access_token

# Setup DB and user
db = SessionLocal()
user = db.query(User).filter(User.email=='test@example.com').first()
if not user:
    user = User(email='test@example.com', hashed_password=hash_password('testpassword123'))
    db.add(user)
    db.commit()
    db.refresh(user)

# Create task
task = Task(title='To Delete', owner_id=user.id)
db.add(task)
db.commit()
db.refresh(task)

client = TestClient(app)
client.headers={'Authorization': f'Bearer {create_access_token(data={"sub": str(user.id)})}'}
resp = client.delete(f'/api/v1/tasks/{task.id}')
print('status', resp.status_code)
# Check DB
db_task = db.query(Task).filter_by(id=task.id).first()
print('is_deleted in test db session:', db_task.is_deleted)
# Open new session to verify
newdb = SessionLocal()
ndb_task = newdb.query(Task).filter_by(id=task.id).first()
print('is_deleted in new session:', ndb_task.is_deleted)
