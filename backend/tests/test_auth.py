"""Tests for authentication endpoints."""
import pytest
from app.models.user import User


def test_register_user(client, db):
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "newuser@example.com"
    assert "id" in data["user"]
    assert "access_token" in data

    # Verify user was created
    user = db.query(User).filter_by(email="newuser@example.com").first()
    assert user is not None


def test_register_duplicate_email(client, db, test_user):
    """Test that duplicate emails are rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "password": "password123"}
    )
    assert response.status_code == 400


def test_register_invalid_email(client):
    """Test registration with invalid email."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "not-an-email", "password": "password123"}
    )
    assert response.status_code == 422


def test_register_missing_password(client):
    """Test registration without password."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com"}
    )
    assert response.status_code == 422


def test_register_short_password(client):
    """Test registration with password that's too short."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "short"}
    )
    # Depending on validation rules, this might be 422
    assert response.status_code in [422, 400]


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """Test login with wrong password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """Test login for user that doesn't exist."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"}
    )
    assert response.status_code == 401


def test_login_missing_email(client):
    """Test login without email."""
    response = client.post(
        "/api/v1/auth/login",
        json={"password": "password123"}
    )
    assert response.status_code == 422


def test_login_missing_password(client):
    """Test login without password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com"}
    )
    assert response.status_code == 422


def test_token_format(client, test_user):
    """Test that returned token is valid JWT."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    token = data["access_token"]
    
    # Token should have 3 parts separated by dots
    assert len(token.split(".")) == 3


def test_register_and_login(client, db):
    """Test complete flow: register then login."""
    # Register
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": "flow@example.com", "password": "flowpassword123"}
    )
    assert register_response.status_code == 201

    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "flow@example.com", "password": "flowpassword123"}
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_use_token_for_requests(client, test_user_token):
    """Test using authentication token to access protected endpoints."""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    response = client.get("/api/v1/tasks", headers=headers)
    # Should work without 401 Unauthorized
    assert response.status_code != 401


def test_request_without_token(client):
    """Test that requests without token are rejected."""
    response = client.get("/api/v1/tasks")
    assert response.status_code in [401, 403]  # Unauthorized or Forbidden


def test_invalid_token_format(client):
    """Test request with malformed token."""
    headers = {"Authorization": "Bearer invalid.token.format"}
    response = client.get("/api/v1/tasks", headers=headers)
    assert response.status_code in [401, 403]


def test_expired_token(client, db):
    """Test request with expired token."""
    from app.utils.auth import create_access_token
    from datetime import timedelta
    
    # Create token that expired 1 hour ago
    expired_token = create_access_token(
        data={"sub": "1"},
        expires_delta=timedelta(hours=-1)
    )
    
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/tasks", headers=headers)
    assert response.status_code in [401, 403]
