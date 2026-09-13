import pytest
from supabase_auth.errors import AuthApiError, AuthRetryableError

from app.config import get_settings

SESSION = {
    "access_token": "access",
    "refresh_token": "refresh",
    "expires_in": 3600,
    "expires_at": 1_900_000_000,
    "token_type": "bearer",
}
USER = {"id": "u-1", "email": "asha@example.com", "name": "Asha", "picture": None}


@pytest.fixture
def auth_repo(repo):
    repo.auth_calls = []
    repo.auth_result = {"user": USER, "session": SESSION}
    repo.auth_error = None

    def respond(*args, **kwargs):
        repo.auth_calls.append((args, kwargs))
        if repo.auth_error:
            raise repo.auth_error
        return repo.auth_result

    repo.sign_up_with_password = respond
    repo.sign_in_with_password = respond
    return repo


def test_signup_returns_session(anonymous_client, auth_repo):
    response = anonymous_client.post(
        "/api/auth/signup", json={"name": " Asha ", "email": " Asha@Example.com ", "password": "secret123"}
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["session"]["access_token"] == "access"
    assert body["emailConfirmationRequired"] is False

    (args, kwargs), = auth_repo.auth_calls
    assert args == ("Asha", "asha@example.com", "secret123")
    assert kwargs["redirect_to"] == f"{get_settings().app_host_url.rstrip('/')}/auth"


def test_signup_requiring_email_confirmation(anonymous_client, auth_repo):
    auth_repo.auth_result = {"user": USER, "session": None}

    body = anonymous_client.post(
        "/api/auth/signup", json={"name": "Asha", "email": "asha@example.com", "password": "secret123"}
    ).json()

    assert body["session"] is None
    assert body["emailConfirmationRequired"] is True


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "Asha", "email": "not-an-email", "password": "secret123"},
        {"name": "Asha", "email": "asha@example.com", "password": "123"},
        {"name": "   ", "email": "asha@example.com", "password": "secret123"},
    ],
)
def test_signup_validation(anonymous_client, auth_repo, payload):
    assert anonymous_client.post("/api/auth/signup", json=payload).status_code == 422
    assert auth_repo.auth_calls == []


def test_login_returns_session(anonymous_client, auth_repo):
    response = anonymous_client.post("/api/auth/login", json={"email": "asha@example.com", "password": "secret123"})

    assert response.status_code == 200
    assert response.json()["session"]["refresh_token"] == "refresh"


@pytest.mark.parametrize(
    ("error", "expected_status", "expected_detail"),
    [
        (AuthApiError("Invalid login credentials", 400, "invalid_credentials"), 401, "Invalid email or password."),
        (AuthApiError("Email not confirmed", 400, "email_not_confirmed"), 403, "confirm your email"),
        (AuthApiError("Password is too weak", 422, "weak_password"), 422, "Password is too weak"),
        (AuthApiError("Something odd", 400, None), 400, "Something odd"),
        (AuthRetryableError("connection reset", 0), 502, "Authentication service error"),
    ],
)
def test_login_maps_supabase_errors(anonymous_client, auth_repo, error, expected_status, expected_detail):
    auth_repo.auth_error = error

    response = anonymous_client.post("/api/auth/login", json={"email": "asha@example.com", "password": "secret123"})

    assert response.status_code == expected_status
    assert expected_detail in response.json()["detail"]


def test_signup_existing_account(anonymous_client, auth_repo):
    auth_repo.auth_error = AuthApiError("User already registered", 422, "user_already_exists")

    response = anonymous_client.post(
        "/api/auth/signup", json={"name": "Asha", "email": "asha@example.com", "password": "secret123"}
    )

    assert response.status_code == 409
