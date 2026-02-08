"""Pytest configuration and fixtures."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.utils.auth import hash_password, create_access_token

# Import all models so Base.metadata has every table before create_all()
from app.models import user as _user  # noqa: F401
from app.models import task as _task  # noqa: F401
from app.models import comment as _comment  # noqa: F401
from app.models import file as _file  # noqa: F401

# Use in-memory SQLite for tests; StaticPool keeps one connection so all sessions share the same DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create test database tables once per test session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def db():
    """Get test database session with cleanup between tests."""
    db = TestingSessionLocal()
    # Clear all tables before test to ensure clean state
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    yield db
    # Cleanup after test
    db.rollback()
    db.close()


@pytest.fixture
def client():
    """Get test client."""
    return TestClient(app)


@pytest.fixture
def test_user(db):
    """Get or create test user (idempotent; no duplicate inserts)."""
    user = db.query(User).filter(User.email == "test@example.com").first()

    if not user:
        user = User(
            email="test@example.com",
            hashed_password=hash_password("testpassword123"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


@pytest.fixture
def test_user_token(test_user):
    """Get JWT token for test user."""
    return create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
def authenticated_client(client, test_user_token):
    """Get test client with authorization header."""
    client.headers = {
        "Authorization": f"Bearer {test_user_token}"
    }
    return client
