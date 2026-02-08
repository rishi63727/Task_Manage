import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal as TestingSessionLocal
from app.models.user import User
from app.models.task import Task, TaskPriority
from app.utils.auth import hash_password, create_access_token

# Create user and tasks
db = TestingSessionLocal()
user = db.query(User).filter(User.email=='test@example.com').first()
if not user:
    user = User(email='test@example.com', hashed_password=hash_password('testpassword123'))
    db.add(user)
    db.commit()
    db.refresh(user)

# Add tasks
db.add(Task(title='Task 1', description='Desc 1', priority=TaskPriority.high, owner_id=user.id))
db.add(Task(title='Task 2', description='Desc 2', priority=TaskPriority.low, completed=True, owner_id=user.id))
db.commit()

client = TestClient(app)
token = create_access_token(data={"sub": str(user.id)})
client.headers = {"Authorization": f"Bearer {token}"}
resp = client.get('/api/v1/tasks/export?format=csv')
print('status', resp.status_code)
print('headers', resp.headers)
print('text', resp.text[:500])
