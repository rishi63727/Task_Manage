from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin
from app.utils.auth import create_access_token, hash_password, verify_password, get_current_user


router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# Minimum password length; short passwords return 400 (business rule)
MIN_PASSWORD_LENGTH = 8


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user account. Returns 201 on success, 400 if user already exists or password too short."""
    if len(user.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too short"
        )
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    hashed_password = hash_password(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token for new user
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": new_user.id, "email": new_user.email}
    }


@router.post("/login", status_code=status.HTTP_200_OK)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT access token. Returns 200 on success, 401 on failure."""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email}
    }


@router.get("/me")
def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current authenticated user information. Returns 401 if not authenticated."""
    return {"id": user.id, "email": user.email}
