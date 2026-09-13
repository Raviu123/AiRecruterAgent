import logging

from fastapi import APIRouter, Depends
from postgrest.exceptions import APIError

from app.auth import AuthUser, get_current_user
from app.database import Repository, get_repository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _overall_score(feedback_row: dict) -> int | None:
    report = (feedback_row.get("feedback") or {}).get("feedback") or {}
    score = (report.get("rating") or {}).get("overallScore")
    return score if isinstance(score, (int, float)) else None


@router.get("/summary")
def analytics_summary(
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    interviews = repo.list_interviews(user.email, limit=200)

    try:
        attempts = repo.list_aptitude_attempts(user.email)
    except APIError as exc:
        # Aptitude tables are optional until the aptitude module ships.
        logger.info("Aptitude attempts unavailable: %s", exc.message)
        attempts = []

    feedback_rows = [row for interview in interviews for row in interview.get("interview-feedback") or []]
    scores = [score for score in map(_overall_score, feedback_rows) if score is not None]

    return {
        "totalMockInterviews": len(interviews),
        "completedMockSessions": len(feedback_rows),
        "avgInterviewScore": round(sum(scores) / len(scores)) if scores else 0,
        "totalAptitudeQuizzes": len(attempts),
        "avgAptitudeAccuracy": (
            round(sum(a.get("accuracy") or 0 for a in attempts) / len(attempts)) if attempts else 0
        ),
        "recentInterviews": interviews[:5],
        "recentQuizzes": attempts[:5],
    }
