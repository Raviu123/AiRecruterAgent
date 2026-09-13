from fastapi import APIRouter, Depends

from app.auth import AuthUser, get_current_user
from app.database import Repository, get_repository

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("/me")
def sync_current_user(
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Return the signed-in user's profile row, creating it on first sign-in."""
    existing = repo.get_user_by_email(user.email)
    if existing:
        return existing
    return repo.create_user({"name": user.name, "email": user.email, "picture": user.picture})
