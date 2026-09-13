import json
import logging
import re
from functools import lru_cache
from typing import Any

import openai
from openai import OpenAI

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class LLMNotConfiguredError(RuntimeError):
    """No LLM API key is configured."""


class LLMResponseError(RuntimeError):
    """The LLM request failed or returned something unusable."""


def parse_json_content(content: str) -> dict[str, Any]:
    """Parse a JSON object from model output, tolerating ```json fences."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise LLMResponseError("AI provider returned invalid JSON.") from exc
    if not isinstance(parsed, dict):
        raise LLMResponseError("AI provider returned JSON that is not an object.")
    return parsed


class LLMClient:
    def __init__(self, settings: Settings):
        if settings.openrouter_api_key:
            self._client: OpenAI | None = OpenAI(
                base_url=OPENROUTER_BASE_URL,
                api_key=settings.openrouter_api_key,
                timeout=settings.llm_timeout_seconds,
                default_headers={
                    "HTTP-Referer": settings.app_host_url,
                    "X-Title": "AiRecruterAgent",
                },
            )
            self.model = settings.openrouter_model
        elif settings.openai_api_key:
            self._client = OpenAI(api_key=settings.openai_api_key, timeout=settings.llm_timeout_seconds)
            self.model = settings.openai_model
        else:
            self._client = None
            self.model = ""

    @property
    def configured(self) -> bool:
        return self._client is not None

    def complete_json(self, prompt: str, *, temperature: float = 0.4) -> dict[str, Any]:
        if self._client is None:
            raise LLMNotConfiguredError(
                "No AI provider configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY."
            )
        try:
            completion = self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You respond only with a single valid JSON object."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
            )
        except openai.OpenAIError as exc:
            logger.error("LLM request failed: %s", exc)
            raise LLMResponseError(f"AI provider request failed: {exc}") from exc

        if not completion.choices:
            raise LLMResponseError("AI provider returned no choices.")
        return parse_json_content(completion.choices[0].message.content or "")


@lru_cache
def get_llm() -> LLMClient:
    return LLMClient(get_settings())
