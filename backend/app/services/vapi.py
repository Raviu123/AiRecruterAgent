from typing import Any

from app.config import Settings
from app.prompts import VOICE_INTERVIEWER_PROMPT
from app.services.feedback import format_questions


def _duration_minutes(value: Any) -> int:
    try:
        return max(1, int(float(value)))
    except (TypeError, ValueError):
        return 15


def build_assistant_config(settings: Settings, interview: dict[str, Any], candidate_name: str) -> dict[str, Any]:
    """Build the transient Vapi assistant passed to `vapi.start()` in the browser."""
    job_title = interview.get("jobposition") or "Target Role"
    duration = _duration_minutes(interview.get("interviewduration"))
    system_prompt = VOICE_INTERVIEWER_PROMPT.substitute(
        candidate_name=candidate_name,
        job_title=job_title,
        duration=duration,
        questions=format_questions(interview.get("questionList")),
    )

    return {
        "name": "AI Mock Interviewer",
        "firstMessage": (
            f"Hi {candidate_name}! Welcome to your mock interview for the {job_title} position. "
            "Are you ready to begin with the first question?"
        ),
        "transcriber": {"provider": "deepgram", "model": "nova-2", "language": "en-US"},
        "voice": {"provider": settings.vapi_voice_provider, "voiceId": settings.vapi_voice_id},
        "model": {
            "provider": settings.vapi_model_provider,
            "model": settings.vapi_model,
            "messages": [{"role": "system", "content": system_prompt.strip()}],
        },
        # Hard stop a few minutes after the planned duration.
        "maxDurationSeconds": (duration + 5) * 60,
        "endCallMessage": "Thanks for your time today. Your feedback report will be ready shortly. Goodbye!",
    }
