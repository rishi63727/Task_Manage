import os
from uuid import uuid4

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.main import app
from app.database import Base, engine


def setup_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_module(module):
    Base.metadata.drop_all(bind=engine)


def _register_and_login(client: TestClient):
    email = f"user-{uuid4().hex}@example.com"
    password = "password123"
    register = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert register.status_code == 201
    token = register.json()["access_token"]
    return token


def test_create_and_list_tasks():
    client = TestClient(app)
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create = client.post(
        "/api/v1/tasks/",
        headers=headers,
        json={
            "title": "Test task",
            "description": "Test description",
            "priority": "high",
            "status": "in_progress",
            "tags": ["alpha", "beta"],
        },
    )
    assert create.status_code == 201
    task = create.json()
    assert task["title"] == "Test task"
    assert task["status"] == "in_progress"

    list_resp = client.get("/api/v1/tasks/", headers=headers)
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert isinstance(tasks, list)
    assert any(t["id"] == task["id"] for t in tasks)
