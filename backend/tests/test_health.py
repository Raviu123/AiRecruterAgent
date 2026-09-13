import asyncio

import httpx

from app.config import Settings
from app.health import HealthReport, run_health_checks


def make_settings(**overrides) -> Settings:
    values = {
        "supabase_url": "https://proj.supabase.co",
        "supabase_service_role_key": "service-key",
        "supabase_anon_key": "",
        "openrouter_api_key": "or-key",
        "openai_api_key": "",
        **overrides,
    }
    # _env_file=None keeps a developer's backend/.env out of the tests.
    return Settings(_env_file=None, **values)


def run(settings: Settings, handler) -> HealthReport:
    return asyncio.run(run_health_checks(settings, transport=httpx.MockTransport(handler)))


def by_name(report: HealthReport) -> dict:
    return {check.name: check for check in report.checks}


def healthy_handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, json=[] if "/rest/v1/" in request.url.path else {})


def test_all_services_healthy():
    report = run(make_settings(), healthy_handler)
    checks = by_name(report)

    assert report.status == "ok"
    assert checks["supabase database"].status == "ok"
    assert "service role key" in checks["supabase database"].detail
    assert checks["supabase aptitude"].status == "ok"
    assert checks["supabase auth"].status == "ok"
    assert checks["ai provider"].status == "ok"
    assert "OpenRouter" in checks["ai provider"].detail


def test_supabase_not_configured():
    report = run(make_settings(supabase_url="", supabase_service_role_key=""), healthy_handler)

    database = by_name(report)["supabase database"]
    assert report.status == "degraded"
    assert database.status == "error"
    assert "must be set" in database.detail


def test_supabase_unreachable():
    def handler(request):
        if request.url.host == "proj.supabase.co":
            raise httpx.ConnectError("getaddrinfo failed", request=request)
        return httpx.Response(200, json={})

    database = by_name(run(make_settings(), handler))["supabase database"]

    assert database.status == "error"
    assert "cannot reach proj.supabase.co" in database.detail


def test_supabase_rejects_key_and_missing_optional_tables():
    def handler(request):
        path = request.url.path
        if path.endswith("/Users"):
            return httpx.Response(401, json={"message": "Invalid API key"})
        if "aptitude" in path:
            return httpx.Response(404, json={"code": "PGRST205", "message": "Could not find the table"})
        return healthy_handler(request)

    checks = by_name(run(make_settings(), handler))

    assert checks["supabase database"].status == "error"
    assert '"Users" -> HTTP 401: Invalid API key' in checks["supabase database"].detail
    assert checks["supabase aptitude"].status == "warning"


def test_anon_key_warns_about_rls():
    settings = make_settings(supabase_service_role_key="", supabase_anon_key="anon")
    database = by_name(run(settings, healthy_handler))["supabase database"]

    assert database.status == "warning"
    assert "SUPABASE_SERVICE_ROLE_KEY" in database.detail


def test_missing_tables_suggest_migration():
    def handler(request):
        if "/rest/v1/" in request.url.path:
            return httpx.Response(404, json={"code": "PGRST205", "message": "Could not find the table"})
        return healthy_handler(request)

    database = by_name(run(make_settings(), handler))["supabase database"]

    assert database.status == "error"
    assert "python migrate.py" in database.detail


def test_ai_provider_rejected_key():
    def handler(request):
        if request.url.host == "openrouter.ai":
            return httpx.Response(401, json={"error": {"message": "User not found"}})
        return healthy_handler(request)

    ai = by_name(run(make_settings(), handler))["ai provider"]

    assert ai.status == "error"
    assert "rejected the API key" in ai.detail


def test_ai_provider_missing_is_warning():
    report = run(make_settings(openrouter_api_key=""), healthy_handler)

    assert by_name(report)["ai provider"].status == "warning"
    assert report.status == "ok"


def test_health_endpoint_refresh(client, monkeypatch):
    import app.main as main

    report = run(make_settings(), healthy_handler)

    async def fake_checks(_settings):
        return report

    monkeypatch.setattr(main, "run_health_checks", fake_checks)

    body = client.get("/api/health", params={"refresh": "true"}).json()

    assert body["status"] == "ok"
    assert {check["name"] for check in body["checks"]} >= {"supabase database", "supabase auth", "ai provider"}
