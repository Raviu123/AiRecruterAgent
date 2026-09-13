"""Connectivity checks for external dependencies, logged at startup and served by /api/health."""

import asyncio
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Literal
from urllib.parse import quote, urlparse

import httpx

from app.config import Settings
from app.database import (
    APTITUDE_ATTEMPTS_TABLE,
    APTITUDE_QUESTIONS_TABLE,
    FEEDBACK_TABLE,
    INTERVIEWS_TABLE,
    USERS_TABLE,
)
from app.llm import OPENROUTER_BASE_URL

logger = logging.getLogger("app.health")

Status = Literal["ok", "warning", "error", "info"]

REQUIRED_TABLES = (USERS_TABLE, INTERVIEWS_TABLE, FEEDBACK_TABLE)
OPTIONAL_TABLES = (APTITUDE_QUESTIONS_TABLE, APTITUDE_ATTEMPTS_TABLE)
OPENAI_MODELS_URL = "https://api.openai.com/v1/models"

_LOG_LEVELS = {"ok": logging.INFO, "info": logging.INFO, "warning": logging.WARNING, "error": logging.ERROR}
_LABELS = {"ok": "OK  ", "info": "INFO", "warning": "WARN", "error": "FAIL"}


@dataclass
class CheckResult:
    name: str
    status: Status
    detail: str
    latency_ms: int | None = None


@dataclass
class HealthReport:
    checks: list[CheckResult]
    checked_at: str

    @property
    def status(self) -> str:
        return "degraded" if any(check.status == "error" for check in self.checks) else "ok"

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "checkedAt": self.checked_at,
            "checks": [asdict(check) for check in self.checks],
        }


def _elapsed_ms(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)


def _describe_request_error(exc: Exception) -> str:
    if isinstance(exc, httpx.TimeoutException):
        return "request timed out"
    if isinstance(exc, httpx.ConnectError):
        return f"connection failed ({exc})"
    return f"{type(exc).__name__}: {exc}"


def _describe_response_error(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        body = None

    message = None
    if isinstance(body, dict):
        error = body.get("error")
        message = body.get("message") or body.get("msg") or (error.get("message") if isinstance(error, dict) else error)
    return f"HTTP {response.status_code}" + (f": {message}" if message else "")


async def _table_error(client: httpx.AsyncClient, base_url: str, headers: dict, table: str) -> str | None:
    response = await client.get(
        f"{base_url}/rest/v1/{quote(table)}", params={"select": "*", "limit": "1"}, headers=headers
    )
    return None if response.status_code == 200 else _describe_response_error(response)


async def check_supabase(client: httpx.AsyncClient, settings: Settings) -> list[CheckResult]:
    if not settings.supabase_url or not settings.supabase_key:
        return [
            CheckResult(
                "supabase database",
                "error",
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in backend/.env",
            )
        ]

    base_url = settings.supabase_url.rstrip("/")
    host = urlparse(base_url).netloc or base_url
    key = settings.supabase_key
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    tables = REQUIRED_TABLES + OPTIONAL_TABLES

    started = time.perf_counter()
    outcomes = await asyncio.gather(
        *(_table_error(client, base_url, headers, table) for table in tables), return_exceptions=True
    )
    latency = _elapsed_ms(started)

    network_error = next((o for o in outcomes if isinstance(o, Exception)), None)
    if network_error:
        return [
            CheckResult(
                "supabase database",
                "error",
                f"cannot reach {host}: {_describe_request_error(network_error)}",
                latency,
            )
        ]

    errors = dict(zip(tables, outcomes))
    required_errors = {t: errors[t] for t in REQUIRED_TABLES if errors[t]}
    results: list[CheckResult] = []

    if required_errors:
        problems = "; ".join(f'"{table}" -> {error}' for table, error in required_errors.items())
        hint = (
            " -> create the tables with `python migrate.py`"
            if any("HTTP 404" in error for error in required_errors.values())
            else ""
        )
        results.append(
            CheckResult(
                "supabase database", "error", f"connected to {host} but queries failed: {problems}{hint}", latency
            )
        )
    elif settings.supabase_key_type == "anon key":
        results.append(
            CheckResult(
                "supabase database",
                "warning",
                f"connected to {host}, but with the anon key; tables created by migrations have RLS enabled, "
                "so reads return nothing and writes fail. Set SUPABASE_SERVICE_ROLE_KEY in backend/.env",
                latency,
            )
        )
    else:
        results.append(
            CheckResult(
                "supabase database",
                "ok",
                f"connected to {host} with {settings.supabase_key_type}; tables {', '.join(REQUIRED_TABLES)} reachable",
                latency,
            )
        )

    optional_errors = [t for t in OPTIONAL_TABLES if errors[t]]
    if optional_errors:
        results.append(
            CheckResult(
                "supabase aptitude",
                "warning",
                f"optional tables unavailable: {', '.join(optional_errors)} "
                "(aptitude features disabled; `python migrate.py` creates them)",
            )
        )
    else:
        results.append(CheckResult("supabase aptitude", "ok", f"tables {', '.join(OPTIONAL_TABLES)} reachable"))

    started = time.perf_counter()
    try:
        response = await client.get(f"{base_url}/auth/v1/health", headers={"apikey": key})
    except httpx.HTTPError as exc:
        results.append(
            CheckResult("supabase auth", "error", f"auth service unreachable: {_describe_request_error(exc)}")
        )
    else:
        if response.status_code == 200:
            results.append(
                CheckResult("supabase auth", "ok", "auth service reachable (sign-in tokens can be verified)", _elapsed_ms(started))
            )
        else:
            results.append(
                CheckResult(
                    "supabase auth",
                    "error",
                    f"auth service returned {_describe_response_error(response)}",
                    _elapsed_ms(started),
                )
            )
    return results


async def check_ai_provider(client: httpx.AsyncClient, settings: Settings) -> CheckResult:
    if settings.openrouter_api_key:
        provider, model, url, key = "OpenRouter", settings.openrouter_model, f"{OPENROUTER_BASE_URL}/key", settings.openrouter_api_key
    elif settings.openai_api_key:
        provider, model, url, key = "OpenAI", settings.openai_model, OPENAI_MODELS_URL, settings.openai_api_key
    else:
        return CheckResult(
            "ai provider",
            "warning",
            "no OPENROUTER_API_KEY or OPENAI_API_KEY set; questions fall back to a generic set and feedback grading is unavailable",
        )

    started = time.perf_counter()
    try:
        response = await client.get(url, headers={"Authorization": f"Bearer {key}"})
    except httpx.HTTPError as exc:
        return CheckResult("ai provider", "error", f"cannot reach {provider}: {_describe_request_error(exc)}")

    latency = _elapsed_ms(started)
    if response.status_code == 200:
        return CheckResult("ai provider", "ok", f"{provider} API key accepted; model {model}", latency)
    if response.status_code in (401, 403):
        return CheckResult("ai provider", "error", f"{provider} rejected the API key ({_describe_response_error(response)})", latency)
    return CheckResult("ai provider", "warning", f"{provider} key check returned {_describe_response_error(response)}", latency)


def config_checks(settings: Settings) -> list[CheckResult]:
    return [
        CheckResult(
            "vapi voice",
            "info",
            f"assistant voice {settings.vapi_voice_provider}/{settings.vapi_voice_id}, "
            f"model {settings.vapi_model_provider}/{settings.vapi_model} (public key lives in frontend/.env)",
        ),
        CheckResult("cors", "info", f"allowed origins: {', '.join(settings.frontend_origin_list) or '(none)'}"),
    ]


async def run_health_checks(settings: Settings, transport: httpx.AsyncBaseTransport | None = None) -> HealthReport:
    async with httpx.AsyncClient(timeout=settings.health_check_timeout_seconds, transport=transport) as client:
        supabase_results, ai_result = await asyncio.gather(
            check_supabase(client, settings), check_ai_provider(client, settings)
        )
    return HealthReport(
        checks=[*supabase_results, ai_result, *config_checks(settings)],
        checked_at=datetime.now(timezone.utc).isoformat(),
    )


def log_health_report(report: HealthReport) -> None:
    logger.info("Dependency checks:")
    width = max(len(check.name) for check in report.checks)
    for check in report.checks:
        latency = f" [{check.latency_ms} ms]" if check.latency_ms is not None else ""
        logger.log(
            _LOG_LEVELS[check.status],
            "  %s  %s  %s%s",
            _LABELS[check.status],
            check.name.ljust(width),
            check.detail,
            latency,
        )

    failures = sum(check.status == "error" for check in report.checks)
    warnings = sum(check.status == "warning" for check in report.checks)
    if failures:
        logger.error(
            "Startup checks: %d failed, %d warning(s). The API is running, but features that depend on failed services will error.",
            failures,
            warnings,
        )
    elif warnings:
        logger.warning("Startup checks passed with %d warning(s).", warnings)
    else:
        logger.info("Startup checks passed. All services connected.")
