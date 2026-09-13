from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    # Environment variables take precedence over backend/.env.
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase (database + auth token verification).
    # Prefer the service role key on the server; the anon key works if RLS allows it.
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    # Postgres connection string, used only by `python migrate.py` to create tables.
    supabase_db_url: str = ""

    # LLM provider: OpenRouter is used when its key is set, otherwise OpenAI.
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    llm_timeout_seconds: float = 90.0

    # Vapi voice assistant (the public key stays in the Next.js env).
    vapi_voice_provider: str = "vapi"
    vapi_voice_id: str = "Elliot"
    vapi_model_provider: str = "openai"
    vapi_model: str = "gpt-4o-mini"

    app_host_url: str = "http://localhost:3000"
    # Comma-separated list of origins allowed to call the API.
    frontend_origins: str = "http://localhost:3000"

    # Startup / health check timeout per external request.
    health_check_timeout_seconds: float = 5.0

    @property
    def supabase_key(self) -> str:
        return self.supabase_service_role_key or self.supabase_anon_key

    @property
    def supabase_key_type(self) -> str:
        if self.supabase_service_role_key:
            return "service role key"
        return "anon key" if self.supabase_anon_key else "none"

    @property
    def frontend_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
