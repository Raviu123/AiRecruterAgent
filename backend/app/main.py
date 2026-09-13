import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError
from uvicorn.logging import DefaultFormatter

from app.config import get_settings
from app.health import log_health_report, run_health_checks
from app.routers import analytics, aptitude, interviews, users
from app.routers import auth as auth_routes


def configure_logging() -> None:
    """Log `app.*` messages in the same style as uvicorn's own output."""
    app_logger = logging.getLogger("app")
    if app_logger.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(DefaultFormatter("%(levelprefix)s %(message)s"))
    app_logger.addHandler(handler)
    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False


configure_logging()
logger = logging.getLogger("app")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", app.title, app.version)
    report = await run_health_checks(settings)
    app.state.health_report = report
    log_health_report(report)
    logger.info("API docs available at /docs; re-run checks with GET /api/health?refresh=true")
    yield
    logger.info("Shutting down %s", app.title)


app = FastAPI(title="AI Interview Prep API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(APIError)
async def supabase_error_handler(_request: Request, exc: APIError):
    logger.error("Supabase error: %s (code=%s, details=%s)", exc.message, exc.code, exc.details)
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": f"Database error: {exc.message or 'request failed'}"},
    )


app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(interviews.router)
app.include_router(analytics.router)
app.include_router(aptitude.router)


@app.get("/api/health", tags=["health"])
async def health(request: Request, refresh: bool = False):
    """Dependency status from startup; pass ?refresh=true to re-check Supabase and the AI provider now."""
    report = getattr(request.app.state, "health_report", None)
    if refresh or report is None:
        report = await run_health_checks(settings)
        request.app.state.health_report = report
        log_health_report(report)
    return report.to_dict()
