"""Supabase access layer.

Every table read/write in the platform goes through `Repository`, so routers never
build raw queries and tests can swap in an in-memory fake.
"""

import logging
from functools import lru_cache
from typing import Any

from fastapi import HTTPException, status
from supabase import Client, create_client
from supabase_auth import SyncGoTrueClient

from app.config import get_settings

logger = logging.getLogger(__name__)

# Existing Supabase table names (kept for compatibility with current data).
USERS_TABLE = "Users"
INTERVIEWS_TABLE = "Interviews"
FEEDBACK_TABLE = "interview-feedback"
APTITUDE_QUESTIONS_TABLE = "aptitude_questions"
APTITUDE_QUIZZES_TABLE = "aptitude_quizzes"
APTITUDE_ATTEMPTS_TABLE = "aptitude_attempts"

# The bank is a few hundred rows, so a quiz draw pulls the matching slice in one go.
APTITUDE_BANK_FETCH_LIMIT = 5000


@lru_cache
def _create_supabase_client(url: str, key: str) -> Client:
    return create_client(url, key)


def get_supabase_client() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )
    try:
        return _create_supabase_client(settings.supabase_url, settings.supabase_key)
    except Exception as exc:  # invalid URL / key format
        logger.error("Failed to create Supabase client: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Supabase client could not be created: {exc}",
        ) from exc


def _serialize_session(session: Any) -> dict[str, Any] | None:
    if not session:
        return None
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in": session.expires_in,
        "expires_at": session.expires_at,
        "token_type": session.token_type,
    }


def _serialize_auth_user(user: Any) -> dict[str, Any] | None:
    if not user:
        return None
    metadata = user.user_metadata or {}
    return {
        "id": user.id,
        "email": user.email,
        "name": metadata.get("name") or metadata.get("full_name"),
        "picture": metadata.get("picture") or metadata.get("avatar_url"),
    }


class Repository:
    def __init__(self, client: Client):
        self.client = client

    # ---- Auth -------------------------------------------------------------

    def _password_auth_client(self) -> SyncGoTrueClient:
        """A fresh, stateless auth client.

        Signing in on the shared client would make it send the user's JWT on later
        database queries (and share that session across requests), so never do that.
        """
        settings = get_settings()
        key = settings.supabase_anon_key or settings.supabase_key
        return SyncGoTrueClient(
            url=f"{settings.supabase_url.rstrip('/')}/auth/v1",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            auto_refresh_token=False,
            persist_session=False,
        )

    def sign_up_with_password(self, name: str, email: str, password: str, redirect_to: str) -> dict[str, Any]:
        """Create a Supabase Auth user. `session` is None when email confirmation is required."""
        response = self._password_auth_client().sign_up(
            {
                "email": email,
                "password": password,
                "options": {"data": {"name": name}, "email_redirect_to": redirect_to},
            }
        )
        return {"user": _serialize_auth_user(response.user), "session": _serialize_session(response.session)}

    def sign_in_with_password(self, email: str, password: str) -> dict[str, Any]:
        response = self._password_auth_client().sign_in_with_password({"email": email, "password": password})
        return {"user": _serialize_auth_user(response.user), "session": _serialize_session(response.session)}

    def get_auth_user(self, access_token: str) -> dict[str, Any] | None:
        """Verify a Supabase access token and return the auth user, or None if invalid."""
        try:
            response = self.client.auth.get_user(access_token)
        except Exception as exc:
            logger.info("Supabase token verification failed: %s", exc)
            return None
        user = getattr(response, "user", None)
        if not user or not user.email:
            return None
        return _serialize_auth_user(user)

    # ---- Users ------------------------------------------------------------

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        result = self.client.table(USERS_TABLE).select("*").eq("email", email).limit(1).execute()
        return result.data[0] if result.data else None

    def create_user(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table(USERS_TABLE).insert(data).execute()
        return result.data[0]

    # ---- Interviews -------------------------------------------------------

    def create_interview(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table(INTERVIEWS_TABLE).insert(data).execute()
        return result.data[0]

    def list_interviews(self, owner_email: str, limit: int) -> list[dict[str, Any]]:
        result = (
            self.client.table(INTERVIEWS_TABLE)
            .select(f"*,{FEEDBACK_TABLE}(userEmail,feedback)")
            .eq("userEmail", owner_email)
            .order("id", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def get_interview(self, interview_id: str) -> dict[str, Any] | None:
        result = (
            self.client.table(INTERVIEWS_TABLE)
            .select("*")
            .eq("interview_id", interview_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_interview_with_feedback(self, interview_id: str, owner_email: str) -> dict[str, Any] | None:
        result = (
            self.client.table(INTERVIEWS_TABLE)
            .select(f"*,{FEEDBACK_TABLE}(id,userEmail,userName,feedback,created_at)")
            .eq("interview_id", interview_id)
            .eq("userEmail", owner_email)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    # ---- Feedback ---------------------------------------------------------

    def create_feedback(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table(FEEDBACK_TABLE).insert(data).execute()
        return result.data[0]

    def get_feedback(self, interview_id: str, feedback_id: int) -> dict[str, Any] | None:
        result = (
            self.client.table(FEEDBACK_TABLE)
            .select("*")
            .eq("interview_id", interview_id)
            .eq("id", feedback_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    # ---- Aptitude ---------------------------------------------------------

    def upsert_aptitude_questions(self, rows: list[dict[str, Any]]) -> int:
        """Insert or update bank rows keyed on `external_id` (used by seed_aptitude.py)."""
        if not rows:
            return 0
        result = (
            self.client.table(APTITUDE_QUESTIONS_TABLE)
            .upsert(rows, on_conflict="external_id")
            .execute()
        )
        return len(result.data or [])

    def list_aptitude_bank(
        self, category: str | None = None, topic: str | None = None, difficulty: str | None = None
    ) -> list[dict[str, Any]]:
        """Question rows for a quiz draw, without the answer key or explanations."""
        query = self.client.table(APTITUDE_QUESTIONS_TABLE).select("id,category,topic,difficulty,options")
        if category:
            query = query.eq("category", category)
        if topic:
            query = query.eq("topic", topic)
        if difficulty and difficulty != "mixed":
            query = query.eq("difficulty", difficulty)
        return query.limit(APTITUDE_BANK_FETCH_LIMIT).execute().data or []

    def list_aptitude_catalog_rows(self) -> list[dict[str, Any]]:
        result = (
            self.client.table(APTITUDE_QUESTIONS_TABLE)
            .select("id,category,topic,difficulty")
            .limit(APTITUDE_BANK_FETCH_LIMIT)
            .execute()
        )
        return result.data or []

    def get_aptitude_questions_by_ids(self, question_ids: list[Any]) -> list[dict[str, Any]]:
        if not question_ids:
            return []
        result = (
            self.client.table(APTITUDE_QUESTIONS_TABLE)
            .select("*")
            .in_("id", question_ids)
            .execute()
        )
        return result.data or []

    def list_aptitude_questions(
        self, category: str | None, difficulty: str | None, limit: int
    ) -> list[dict[str, Any]]:
        query = self.client.table(APTITUDE_QUESTIONS_TABLE).select("*")
        if category:
            query = query.eq("category", category)
        if difficulty and difficulty != "mixed":
            query = query.eq("difficulty", difficulty)
        return query.limit(limit).execute().data or []

    # ---- Aptitude quizzes -------------------------------------------------

    def create_aptitude_quiz(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table(APTITUDE_QUIZZES_TABLE).insert(data).execute()
        return result.data[0]

    def get_aptitude_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        result = (
            self.client.table(APTITUDE_QUIZZES_TABLE)
            .select("*")
            .eq("quiz_id", quiz_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def complete_aptitude_quiz(self, quiz_id: str, completed_at: str) -> None:
        (
            self.client.table(APTITUDE_QUIZZES_TABLE)
            .update({"status": "completed", "completed_at": completed_at})
            .eq("quiz_id", quiz_id)
            .execute()
        )

    def list_recent_quiz_papers(
        self, user_email: str, category: str | None, difficulty: str | None, limit: int
    ) -> list[dict[str, Any]]:
        """Recent papers for the same settings, so a fresh draw can avoid repeats."""
        query = (
            self.client.table(APTITUDE_QUIZZES_TABLE)
            .select("questions")
            .eq("userEmail", user_email)
        )
        if category:
            query = query.eq("category", category)
        if difficulty:
            query = query.eq("difficulty", difficulty)
        return query.order("created_at", desc=True).limit(limit).execute().data or []

    # ---- Aptitude attempts ------------------------------------------------

    def create_aptitude_attempt(self, data: dict[str, Any]) -> dict[str, Any]:
        result = self.client.table(APTITUDE_ATTEMPTS_TABLE).insert(data).execute()
        return result.data[0]

    def get_aptitude_attempt(self, attempt_id: int, user_email: str) -> dict[str, Any] | None:
        result = (
            self.client.table(APTITUDE_ATTEMPTS_TABLE)
            .select("*")
            .eq("id", attempt_id)
            .eq("userEmail", user_email)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_attempt_by_quiz(self, quiz_id: str) -> dict[str, Any] | None:
        result = (
            self.client.table(APTITUDE_ATTEMPTS_TABLE)
            .select("*")
            .eq("quiz_id", quiz_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    def list_aptitude_attempts(self, user_email: str) -> list[dict[str, Any]]:
        """Attempt summaries. The per-question `review` payload is fetched one at a time."""
        result = (
            self.client.table(APTITUDE_ATTEMPTS_TABLE)
            .select(
                "id,created_at,quiz_id,category,topic,difficulty,score,totalQuestions,"
                "accuracy,timeTakenSeconds,completed_at"
            )
            .eq("userEmail", user_email)
            .order("id", desc=True)
            .execute()
        )
        return result.data or []


def get_repository() -> Repository:
    return Repository(get_supabase_client())
