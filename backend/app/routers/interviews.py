from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import AuthUser, get_current_user
from app.config import Settings, get_settings
from app.database import Repository, get_repository
from app.llm import LLMClient, LLMNotConfiguredError, LLMResponseError, get_llm
from app.schemas import (
    CreateInterviewRequest,
    GenerateQuestionsResponse,
    InterviewSetup,
    SubmitFeedbackRequest,
)
from app.services.feedback import clean_conversation, evaluate_interview, has_candidate_answers
from app.services.questions import generate_questions
from app.services.vapi import build_assistant_config

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# Fields a candidate taking a shared interview link may see (no owner email).
PUBLIC_INTERVIEW_FIELDS = (
    "interview_id",
    "jobposition",
    "jobdescription",
    "interviewduration",
    "type",
    "questionList",
    "created_at",
)


def _require_interview(repo: Repository, interview_id: UUID) -> dict[str, Any]:
    interview = repo.get_interview(str(interview_id))
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    return interview


@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
def generate_interview_questions(
    setup: InterviewSetup,
    _user: AuthUser = Depends(get_current_user),
    llm: LLMClient = Depends(get_llm),
):
    return generate_questions(llm, setup)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: CreateInterviewRequest,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    return repo.create_interview(
        {
            "interview_id": str(uuid4()),
            "jobposition": payload.jobposition,
            "jobdescription": payload.jobdescription,
            "interviewduration": payload.interviewduration,
            "type": ", ".join(payload.type),
            "questionList": [q.model_dump(exclude_none=True) for q in payload.questionList],
            "userEmail": user.email,
        }
    )


@router.get("")
def list_my_interviews(
    limit: int = Query(default=50, ge=1, le=200),
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    return repo.list_interviews(user.email, limit)


@router.get("/{interview_id}")
def get_interview(interview_id: UUID, repo: Repository = Depends(get_repository)):
    """Public: used by the candidate lobby and interview room via the shared link."""
    interview = _require_interview(repo, interview_id)
    return {field: interview.get(field) for field in PUBLIC_INTERVIEW_FIELDS}


@router.get("/{interview_id}/details")
def get_interview_details(
    interview_id: UUID,
    user: AuthUser = Depends(get_current_user),
    repo: Repository = Depends(get_repository),
):
    """Owner only: the interview plus every candidate attempt and report."""
    interview = repo.get_interview_with_feedback(str(interview_id), user.email)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    return interview


@router.get("/{interview_id}/assistant-config")
def get_assistant_config(
    interview_id: UUID,
    user_name: str = Query(default="Candidate", max_length=120),
    repo: Repository = Depends(get_repository),
    settings: Settings = Depends(get_settings),
):
    interview = _require_interview(repo, interview_id)
    return build_assistant_config(settings, interview, user_name.strip() or "Candidate")


@router.post("/{interview_id}/feedback", status_code=status.HTTP_201_CREATED)
def submit_interview_feedback(
    interview_id: UUID,
    payload: SubmitFeedbackRequest,
    repo: Repository = Depends(get_repository),
    llm: LLMClient = Depends(get_llm),
):
    """Public: grade a finished attempt (voice or text) and store the report."""
    interview = _require_interview(repo, interview_id)

    conversation = clean_conversation(payload.conversation)
    if not has_candidate_answers(conversation):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate answers were captured, so there is nothing to evaluate.",
        )

    try:
        report = evaluate_interview(llm, interview, conversation)
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except LLMResponseError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return repo.create_feedback(
        {
            "interview_id": str(interview_id),
            "userName": payload.userName.strip(),
            "userEmail": payload.userEmail.strip(),
            # Stored wrapped in {"feedback": ...} to match existing records.
            "feedback": {"feedback": report.model_dump(), "mode": payload.mode, "transcript": conversation},
            "recommendation": report.is_ready,
        }
    )


@router.get("/{interview_id}/feedback/{feedback_id}")
def get_interview_feedback(
    interview_id: UUID,
    feedback_id: int,
    repo: Repository = Depends(get_repository),
):
    feedback = repo.get_feedback(str(interview_id), feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback report not found.")
    return feedback
