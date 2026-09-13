from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from app.database import Repository, get_repository


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str
    name: str | None = None
    picture: str | None = None


def get_current_user(
    authorization: str | None = Header(default=None),
    repo: Repository = Depends(get_repository),
) -> AuthUser:
    """Resolve the signed-in user from the Supabase access token sent by the frontend."""
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = repo.get_auth_user(token.strip())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return AuthUser(**user)
