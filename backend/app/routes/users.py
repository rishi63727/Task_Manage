"""Users list for assignee dropdown (id, email)."""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Users"])


@router.get("/users", status_code=status.HTTP_200_OK)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Return all users (id, email) for assignee dropdown. Authenticated only."""
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email} for u in users]
