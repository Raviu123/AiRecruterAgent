from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status

from app.auth import AuthUser, get_current_user
from app.database import Repository, get_repository
from app.schemas import AptitudeAttemptRequest

router = APIRouter(prefix="/api/aptitude", tags=["aptitude"])


@router.get("/questions")
def list_aptitude_questions(
    category: str | None = None,
    difficulty: str | None = None,
    limit: int = Query(default=10, ge=1, le=100),
    _user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    return repo.list_aptitude_questions(category, difficulty, limit)


@router.post("/attempts", status_code=status.HTTP_201_CREATED)
def submit_aptitude_attempt(
    payload: AptitudeAttemptRequest,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    return repo.create_aptitude_attempt(
        {
            "userId": user.id,
            "userEmail": user.email,
            "category": payload.category,
            "difficulty": payload.difficulty,
            "score": payload.score,
            "totalQuestions": payload.totalQuestions,
            "accuracy": round(payload.score / payload.totalQuestions * 100),
            "userAnswers": payload.userAnswers,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
