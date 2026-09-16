import re
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

RECOMMENDATIONS = ("Ready for Live Interviews", "Conditionally Ready", "Needs Focused Preparation")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LoginRequest(BaseModel):
    email: str = Field(max_length=320)
    # Supabase's default minimum is 6; bcrypt ignores bytes beyond 72.
    password: str = Field(min_length=6, max_length=72)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.match(value):
            raise ValueError("Enter a valid email address")
        return value


class SignupRequest(LoginRequest):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value


class InterviewQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    type: str = Field(default="General", max_length=100)
    hint: str | None = Field(default=None, max_length=2000)

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be empty")
        return value


class InterviewSetup(BaseModel):
    jobposition: str = Field(min_length=1, max_length=200)
    jobdescription: str = Field(min_length=1, max_length=20000)
    interviewduration: str = "15"
    type: list[str] = Field(default_factory=list)

    @field_validator("jobposition", "jobdescription")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("interviewduration", mode="before")
    @classmethod
    def normalize_duration(cls, value: Any) -> str:
        if value is None or value == "":
            return "15"
        return str(value)

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value


class GenerateQuestionsResponse(BaseModel):
    questions: list[InterviewQuestion]
    source: Literal["ai", "fallback"]
    warning: str | None = None


class CreateInterviewRequest(InterviewSetup):
    questionList: list[InterviewQuestion] = Field(min_length=1, max_length=30)


class TranscriptMessage(BaseModel):
    role: str = Field(max_length=20)
    content: str = Field(default="", max_length=10000)


class SubmitFeedbackRequest(BaseModel):
    userName: str = Field(min_length=1, max_length=120)
    userEmail: str = Field(default="", max_length=320)
    conversation: list[TranscriptMessage] = Field(max_length=1000)
    mode: Literal["voice", "text"] = "voice"


def _clamp_int(value: Any, upper: int) -> int:
    try:
        number = round(float(value))
    except (TypeError, ValueError):
        return 0
    return max(0, min(upper, number))


class Rating(BaseModel):
    technicalSkills: int
    communication: int
    problemSolving: int
    experience: int
    overallScore: int

    @field_validator("technicalSkills", "communication", "problemSolving", "experience", mode="before")
    @classmethod
    def clamp_skill(cls, value: Any) -> int:
        return _clamp_int(value, 10)

    @field_validator("overallScore", mode="before")
    @classmethod
    def clamp_overall(cls, value: Any) -> int:
        return _clamp_int(value, 100)


class FeedbackReport(BaseModel):
    rating: Rating
    recommendation: str
    recommendationMsg: str = ""
    summary: str
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    preparationAdvice: list[str] = Field(default_factory=list)

    @field_validator("recommendation", mode="before")
    @classmethod
    def normalize_recommendation(cls, value: Any) -> str:
        text = str(value or "").strip()
        for option in RECOMMENDATIONS:
            if text.lower() == option.lower():
                return option
        return text or "Conditionally Ready"

    @property
    def is_ready(self) -> bool:
        return self.recommendation == RECOMMENDATIONS[0]


class StartAptitudeQuizRequest(BaseModel):
    """Quiz settings chosen in the playground; the paper is drawn from the bank."""

    category: str | None = Field(default=None, max_length=200)
    topic: str | None = Field(default=None, max_length=200)
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    questionCount: int = Field(default=10, ge=1, le=50)

    @field_validator("category", "topic", mode="before")
    @classmethod
    def blank_to_none(cls, value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
            # "All categories" arrives as an empty string.
            return value or None
        return value


class AptitudeAnswer(BaseModel):
    questionId: int
    # The index of the option as displayed, or None when the question was skipped.
    selectedIndex: int | None = Field(default=None, ge=0, le=25)


class SubmitAptitudeQuizRequest(BaseModel):
    answers: list[AptitudeAnswer] = Field(default_factory=list, max_length=50)
    timeTakenSeconds: int = Field(default=0, ge=0, le=86400)
