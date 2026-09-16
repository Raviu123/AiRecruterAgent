import uuid
from datetime import datetime, timezone
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.auth import AuthUser, get_current_user
from app.database import get_repository
from app.llm import LLMNotConfiguredError, get_llm
from app.main import app

OWNER = AuthUser(id="user-1", email="owner@example.com", name="Owner", picture=None)


class FakeRepository:
    """In-memory stand-in for the Supabase repository."""

    def __init__(self):
        self.users: list[dict[str, Any]] = []
        self.interviews: list[dict[str, Any]] = []
        self.feedback: list[dict[str, Any]] = []
        self.aptitude_questions: list[dict[str, Any]] = []
        self.aptitude_quizzes: list[dict[str, Any]] = []
        self.aptitude_attempts: list[dict[str, Any]] = []

    def _stamp(self, rows: list, data: dict) -> dict:
        row = {**data, "id": len(rows) + 1, "created_at": datetime.now(timezone.utc).isoformat()}
        rows.append(row)
        return row

    def get_auth_user(self, access_token):
        return None

    def get_user_by_email(self, email):
        return next((u for u in self.users if u["email"] == email), None)

    def create_user(self, data):
        return self._stamp(self.users, data)

    def create_interview(self, data):
        return self._stamp(self.interviews, data)

    def _with_feedback(self, interview, fields):
        rows = [f for f in self.feedback if f["interview_id"] == interview["interview_id"]]
        return {**interview, "interview-feedback": [{k: r.get(k) for k in fields} for r in rows]}

    def list_interviews(self, owner_email, limit):
        mine = [i for i in reversed(self.interviews) if i["userEmail"] == owner_email][:limit]
        return [self._with_feedback(i, ("userEmail", "feedback")) for i in mine]

    def get_interview(self, interview_id):
        return next((i for i in self.interviews if i["interview_id"] == interview_id), None)

    def get_interview_with_feedback(self, interview_id, owner_email):
        interview = self.get_interview(interview_id)
        if not interview or interview["userEmail"] != owner_email:
            return None
        return self._with_feedback(interview, ("id", "userEmail", "userName", "feedback", "created_at"))

    def create_feedback(self, data):
        return self._stamp(self.feedback, data)

    def get_feedback(self, interview_id, feedback_id):
        return next(
            (f for f in self.feedback if f["interview_id"] == interview_id and f["id"] == feedback_id),
            None,
        )

    # ---- Aptitude ---------------------------------------------------------

    def seed_aptitude_questions(self, rows: list[dict[str, Any]]) -> None:
        for row in rows:
            self._stamp(self.aptitude_questions, row)

    def upsert_aptitude_questions(self, rows):
        for row in rows:
            existing = next(
                (q for q in self.aptitude_questions if q.get("external_id") == row.get("external_id")), None
            )
            if existing:
                existing.update(row)
            else:
                self._stamp(self.aptitude_questions, row)
        return len(rows)

    def list_aptitude_bank(self, category=None, topic=None, difficulty=None):
        rows = self.aptitude_questions
        if category:
            rows = [q for q in rows if q["category"] == category]
        if topic:
            rows = [q for q in rows if q["topic"] == topic]
        if difficulty and difficulty != "mixed":
            rows = [q for q in rows if q["difficulty"] == difficulty]
        return [{k: q[k] for k in ("id", "category", "topic", "difficulty", "options")} for q in rows]

    def list_aptitude_catalog_rows(self):
        return [{k: q[k] for k in ("id", "category", "topic", "difficulty")} for q in self.aptitude_questions]

    def get_aptitude_questions_by_ids(self, question_ids):
        return [q for q in self.aptitude_questions if q["id"] in set(question_ids)]

    def list_aptitude_questions(self, category, difficulty, limit):
        rows = self.aptitude_questions
        if category:
            rows = [q for q in rows if q["category"] == category]
        if difficulty and difficulty != "mixed":
            rows = [q for q in rows if q["difficulty"] == difficulty]
        return rows[:limit]

    def create_aptitude_quiz(self, data):
        quiz = {
            **data,
            "quiz_id": str(uuid.uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.aptitude_quizzes.append(quiz)
        return quiz

    def get_aptitude_quiz(self, quiz_id):
        return next((q for q in self.aptitude_quizzes if q["quiz_id"] == quiz_id), None)

    def complete_aptitude_quiz(self, quiz_id, completed_at):
        quiz = self.get_aptitude_quiz(quiz_id)
        if quiz:
            quiz.update({"status": "completed", "completed_at": completed_at})

    def list_recent_quiz_papers(self, user_email, category, difficulty, limit):
        rows = [
            q
            for q in reversed(self.aptitude_quizzes)
            if q["userEmail"] == user_email
            and (category is None or q.get("category") == category)
            and (difficulty is None or q.get("difficulty") == difficulty)
        ]
        return [{"questions": q["questions"]} for q in rows[:limit]]

    def create_aptitude_attempt(self, data):
        return self._stamp(self.aptitude_attempts, data)

    def get_aptitude_attempt(self, attempt_id, user_email):
        return next(
            (a for a in self.aptitude_attempts if a["id"] == attempt_id and a["userEmail"] == user_email),
            None,
        )

    def get_attempt_by_quiz(self, quiz_id):
        return next((a for a in self.aptitude_attempts if a.get("quiz_id") == quiz_id), None)

    def list_aptitude_attempts(self, user_email):
        return [a for a in reversed(self.aptitude_attempts) if a["userEmail"] == user_email]


class FakeLLM:
    def __init__(self):
        self.responses: list[Any] = []
        self.prompts: list[str] = []
        self.configured = True

    def complete_json(self, prompt, *, temperature=0.4):
        self.prompts.append(prompt)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


@pytest.fixture
def repo():
    return FakeRepository()


@pytest.fixture
def llm():
    return FakeLLM()


@pytest.fixture
def client(repo, llm):
    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_llm] = lambda: llm
    app.dependency_overrides[get_current_user] = lambda: OWNER
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def anonymous_client(repo, llm):
    app.dependency_overrides[get_repository] = lambda: repo
    app.dependency_overrides[get_llm] = lambda: llm
    yield TestClient(app)
    app.dependency_overrides.clear()


def not_configured():
    return LLMNotConfiguredError("No AI provider configured.")
