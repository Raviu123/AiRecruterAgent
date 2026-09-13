import logging

from pydantic import ValidationError

from app.llm import LLMClient, LLMNotConfiguredError, LLMResponseError
from app.prompts import QUESTION_PROMPT
from app.schemas import GenerateQuestionsResponse, InterviewQuestion, InterviewSetup

logger = logging.getLogger(__name__)


def fallback_questions(job_title: str) -> list[InterviewQuestion]:
    return [
        InterviewQuestion(
            question=f"Could you walk me through your background and the projects most relevant to a {job_title} role?",
            type="Experience",
            hint="Highlight key projects, architecture choices, and your responsibilities.",
        ),
        InterviewQuestion(
            question="Based on the job description, how would you design or implement a core component of this system?",
            type="Technical",
            hint="Discuss trade-offs, tech stack choice, scalability, and code quality.",
        ),
        InterviewQuestion(
            question="Describe a challenging bug or incident you handled in production. How did you diagnose and resolve it?",
            type="Problem Solving",
            hint="Explain root cause analysis, tools used, and prevention measures.",
        ),
        InterviewQuestion(
            question="How do you handle ambiguous requirements or disagreement with stakeholders on technical direction?",
            type="Behavioral",
            hint="Emphasize collaboration, clear communication, and data-driven decisions.",
        ),
    ]


def generate_questions(llm: LLMClient, setup: InterviewSetup) -> GenerateQuestionsResponse:
    """Generate interview questions for a JD, falling back to a generic set if the AI call fails."""
    prompt = QUESTION_PROMPT.substitute(
        job_title=setup.jobposition,
        job_description=setup.jobdescription,
        duration=setup.interviewduration,
        focus_areas=", ".join(setup.type) or "Technical, Behavioral",
    )
    try:
        data = llm.complete_json(prompt, temperature=0.7)
        raw_questions = data.get("interviewQuestions") or data.get("questions") or []
        questions = [InterviewQuestion.model_validate(item) for item in raw_questions]
        if not questions:
            raise LLMResponseError("AI provider returned no questions.")
        return GenerateQuestionsResponse(questions=questions, source="ai")
    except (LLMNotConfiguredError, LLMResponseError, ValidationError) as exc:
        logger.warning("Question generation fell back to defaults: %s", exc)
        return GenerateQuestionsResponse(
            questions=fallback_questions(setup.jobposition),
            source="fallback",
            warning=f"AI generation unavailable, showing generic questions. ({exc})",
        )
