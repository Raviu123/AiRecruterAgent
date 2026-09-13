import json
from typing import Any

from pydantic import ValidationError

from app.llm import LLMClient, LLMResponseError
from app.prompts import FEEDBACK_PROMPT
from app.schemas import FeedbackReport, TranscriptMessage

SPEAKER_ROLES = {"assistant", "user"}


def clean_conversation(conversation: list[TranscriptMessage]) -> list[dict[str, str]]:
    """Keep only interviewer/candidate turns that contain text."""
    return [
        {"role": message.role, "content": message.content.strip()}
        for message in conversation
        if message.role in SPEAKER_ROLES and message.content.strip()
    ]


def has_candidate_answers(conversation: list[dict[str, str]]) -> bool:
    return any(message["role"] == "user" for message in conversation)


def format_questions(question_list: Any) -> str:
    lines = []
    for index, item in enumerate(question_list or [], start=1):
        text = item if isinstance(item, str) else (item or {}).get("question", "")
        if text:
            lines.append(f"{index}. {text}")
    return "\n".join(lines) or "(not provided)"


def evaluate_interview(
    llm: LLMClient, interview: dict[str, Any], conversation: list[dict[str, str]]
) -> FeedbackReport:
    """Ask the LLM to grade the transcript. Raises LLMNotConfiguredError / LLMResponseError."""
    prompt = FEEDBACK_PROMPT.substitute(
        job_title=interview.get("jobposition") or "the target",
        questions=format_questions(interview.get("questionList")),
        conversation=json.dumps(conversation, ensure_ascii=False, indent=1),
    )
    data = llm.complete_json(prompt, temperature=0.2)
    try:
        return FeedbackReport.model_validate(data.get("feedback", data))
    except ValidationError as exc:
        raise LLMResponseError("AI provider returned feedback in an unexpected format.") from exc
