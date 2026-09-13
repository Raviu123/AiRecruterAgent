import logging

from fastapi import APIRouter, Depends, HTTPException, status
from supabase_auth.errors import AuthApiError, AuthError

from app.config import Settings, get_settings
from app.database import Repository, get_repository
from app.schemas import LoginRequest, SignupRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Supabase error codes -> (HTTP status, message shown to the user)
_AUTH_ERRORS = {
    "invalid_credentials": (status.HTTP_401_UNAUTHORIZED, "Invalid email or password."),
    "email_not_confirmed": (
        status.HTTP_403_FORBIDDEN,
        "Please confirm your email address first. Check your inbox for the confirmation link.",
    ),
    "user_already_exists": (status.HTTP_409_CONFLICT, "An account with this email already exists. Sign in instead."),
    "email_exists": (status.HTTP_409_CONFLICT, "An account with this email already exists. Sign in instead."),
    "weak_password": (status.HTTP_422_UNPROCESSABLE_ENTITY, None),
    "signup_disabled": (status.HTTP_403_FORBIDDEN, "New sign-ups are currently disabled."),
    "over_request_rate_limit": (status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Please wait a moment and try again."),
    "over_email_send_rate_limit": (
        status.HTTP_429_TOO_MANY_REQUESTS,
        "Too many confirmation emails sent. Please wait a few minutes and try again.",
    ),
}


def _to_http_error(exc: AuthError) -> HTTPException:
    if isinstance(exc, AuthApiError):
        mapped_status, message = _AUTH_ERRORS.get(exc.code or "", (None, None))
        if mapped_status:
            return HTTPException(status_code=mapped_status, detail=message or exc.message)
        if 400 <= exc.status < 500:
            return HTTPException(status_code=exc.status, detail=exc.message)
    logger.error("Supabase auth request failed: %s", exc)
    return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Authentication service error. Please try again.")


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def sign_up(
    payload: SignupRequest,
    repo: Repository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
):
    """Create an account. Returns a session unless Supabase requires email confirmation first."""
    try:
        result = repo.sign_up_with_password(
            payload.name,
            payload.email,
            payload.password,
            redirect_to=f"{settings.app_host_url.rstrip('/')}/auth",
        )
    except AuthError as exc:
        raise _to_http_error(exc) from exc

    return {**result, "emailConfirmationRequired": result["session"] is None}


@router.post("/login")
def log_in(payload: LoginRequest, repo: Repository = Depends(get_repository)):
    try:
        result = repo.sign_in_with_password(payload.email, payload.password)
    except AuthError as exc:
        raise _to_http_error(exc) from exc

    if not result["session"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    return result
