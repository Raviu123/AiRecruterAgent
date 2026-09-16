"""Aptitude playground API.

Questions come from the seeded bank (`backend/seed_aptitude.py`), never from the LLM.
A quiz is drawn once, stored as a paper in `aptitude_quizzes`, and graded here on
submit - the browser never receives `correctOptionIndex` before it answers.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import AuthUser, get_current_user
from app.database import Repository, get_repository
from app.schemas import StartAptitudeQuizRequest, SubmitAptitudeQuizRequest
from app.services.aptitude import (
    SECONDS_PER_QUESTION,
    NotEnoughQuestionsError,
    build_catalog,
    build_quiz_paper,
    filter_pool,
    grade_quiz,
    present_question,
    summarize_review,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/aptitude", tags=["aptitude"])

# How many of the candidate's recent papers (same settings) are excluded from a new draw.
RECENT_PAPERS_TO_AVOID = 8


def _seen_question_ids(repo: Repository, user_email: str, payload: StartAptitudeQuizRequest) -> set[int]:
    """Question ids from this candidate's recent papers for the same settings."""
    papers = repo.list_recent_quiz_papers(
        user_email, payload.category, payload.difficulty, RECENT_PAPERS_TO_AVOID
    )
    return {
        entry["questionId"]
        for paper in papers
        for entry in paper.get("questions") or []
        if entry.get("questionId") is not None
    }


def _quiz_payload(quiz: dict, questions: list[dict]) -> dict:
    questions_by_id = {question["id"]: question for question in questions}
    paper = quiz.get("questions") or []
    return {
        "quizId": quiz["quiz_id"],
        "category": quiz.get("category"),
        "topic": quiz.get("topic"),
        "difficulty": quiz.get("difficulty"),
        "totalQuestions": quiz.get("totalQuestions") or len(paper),
        "durationSeconds": quiz.get("durationSeconds") or 0,
        "status": quiz.get("status"),
        "questions": [
            present_question(questions_by_id[entry["questionId"]], entry.get("optionOrder") or [], number)
            for number, entry in enumerate(paper, start=1)
            if entry.get("questionId") in questions_by_id
        ],
    }


def _load_own_quiz(repo: Repository, quiz_id: str, user: AuthUser) -> dict:
    quiz = repo.get_aptitude_quiz(quiz_id)
    if not quiz or quiz.get("userEmail") != user.email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return quiz


@router.get("/catalog")
def aptitude_catalog(
    _user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Categories, topics and per-difficulty counts available in the seeded bank."""
    return build_catalog(repo.list_aptitude_catalog_rows())


@router.post("/quizzes", status_code=status.HTTP_201_CREATED)
def start_aptitude_quiz(
    payload: StartAptitudeQuizRequest,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Draw a fresh randomised paper, avoiding questions seen in recent quizzes."""
    pool = filter_pool(
        repo.list_aptitude_bank(payload.category, payload.topic, payload.difficulty),
        payload.category,
        payload.topic,
        payload.difficulty,
    )
    try:
        paper = build_quiz_paper(
            pool,
            payload.questionCount,
            payload.difficulty,
            _seen_question_ids(repo, user.email, payload),
        )
    except NotEnoughQuestionsError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    quiz = repo.create_aptitude_quiz(
        {
            "userId": user.id,
            "userEmail": user.email,
            "category": payload.category,
            "topic": payload.topic,
            "difficulty": payload.difficulty,
            "totalQuestions": len(paper),
            "durationSeconds": len(paper) * SECONDS_PER_QUESTION,
            "questions": paper,
            "status": "in_progress",
        }
    )
    questions = repo.get_aptitude_questions_by_ids([entry["questionId"] for entry in paper])
    return _quiz_payload(quiz, questions)


@router.get("/quizzes/{quiz_id}")
def get_aptitude_quiz(
    quiz_id: str,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Re-serve an in-progress paper (page refresh mid-quiz)."""
    quiz = _load_own_quiz(repo, quiz_id, user)
    questions = repo.get_aptitude_questions_by_ids(
        [entry["questionId"] for entry in quiz.get("questions") or []]
    )
    return _quiz_payload(quiz, questions)


@router.post("/quizzes/{quiz_id}/submit")
def submit_aptitude_quiz(
    quiz_id: str,
    payload: SubmitAptitudeQuizRequest,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Grade a paper, store the attempt and return the full review with explanations."""
    quiz = _load_own_quiz(repo, quiz_id, user)
    if quiz.get("status") == "completed":
        existing = repo.get_attempt_by_quiz(quiz_id)
        if existing:
            return _attempt_payload(existing)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This quiz was already submitted.")

    paper = quiz.get("questions") or []
    questions = repo.get_aptitude_questions_by_ids([entry["questionId"] for entry in paper])
    review = grade_quiz(
        paper,
        {question["id"]: question for question in questions},
        {answer.questionId: answer.selectedIndex for answer in payload.answers},
    )
    summary = summarize_review(review)
    now = datetime.now(timezone.utc).isoformat()

    attempt = repo.create_aptitude_attempt(
        {
            "quiz_id": quiz_id,
            "userId": user.id,
            "userEmail": user.email,
            "category": quiz.get("category"),
            "topic": quiz.get("topic"),
            "difficulty": quiz.get("difficulty"),
            "score": summary["score"],
            "totalQuestions": summary["totalQuestions"],
            "accuracy": summary["accuracy"],
            "timeTakenSeconds": payload.timeTakenSeconds,
            "userAnswers": [
                {"questionId": item["questionId"], "selectedIndex": item["selectedIndex"]} for item in review
            ],
            "review": review,
            "completed_at": now,
        }
    )
    repo.complete_aptitude_quiz(quiz_id, now)
    return _attempt_payload(attempt)


def _attempt_payload(attempt: dict) -> dict:
    review = attempt.get("review") or []
    return {
        "attemptId": attempt.get("id"),
        "quizId": attempt.get("quiz_id"),
        "category": attempt.get("category"),
        "topic": attempt.get("topic"),
        "difficulty": attempt.get("difficulty"),
        "timeTakenSeconds": attempt.get("timeTakenSeconds") or 0,
        "completedAt": attempt.get("completed_at") or attempt.get("created_at"),
        "review": review,
        **summarize_review(review),
    }


@router.get("/attempts")
def list_aptitude_attempts(
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    return repo.list_aptitude_attempts(user.email)


@router.get("/attempts/{attempt_id}")
def get_aptitude_attempt(
    attempt_id: int,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """The stored per-question review for one past attempt."""
    attempt = repo.get_aptitude_attempt(attempt_id, user.email)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found.")
    return _attempt_payload(attempt)


@router.get("/questions")
def list_aptitude_questions(
    category: str | None = None,
    difficulty: str | None = None,
    limit: int = Query(default=10, ge=1, le=100),
    _user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Raw bank rows (answers included) - for admin/debugging, not the quiz flow."""
    return repo.list_aptitude_questions(category, difficulty, limit)
