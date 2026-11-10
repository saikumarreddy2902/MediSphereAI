"""
MediSphere AI — Enterprise Application Configuration

Module: Core Settings Manager
Description: Uses Pydantic BaseSettings for strongly typed, validated environment configuration.
             Injects system configurations from environment variables or .env files securely.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central application settings container enforcing type validation across database connections,
    caching layer, authentication parameters, AI vector services, and CORS security.
    """
    # ─── App Metadata & Environment ───────────────────────────────────────────────
    PROJECT_NAME: str = "MediSphere AI"
    API_VERSION: str = "v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # ─── MongoDB Atlas Configuration ──────────────────────────────────────────────
    # Required — must be set via environment variable; no default with credentials
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "medisphere_db"

    # ─── Redis Caching & Queue Configuration ──────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_TTL: int = 3600  # Default cache expiration in seconds (1 hour)

    # ─── Qdrant Vector Store Configuration ───────────────────────────────────────
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # ─── AI / LLM Configuration ──────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:8b"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # ─── Authentication & JWT Security Configuration ─────────────────────────────
    # MUST be overridden in production via SECRET_KEY env var
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_256BIT_RANDOM"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60    # 1 hour (short-lived)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7       # 7 days

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:  # type: ignore[override]
        if v == "CHANGE_ME_IN_PRODUCTION_USE_256BIT_RANDOM":
            import secrets
            generated = secrets.token_hex(32)
            print(f"INFO: No SECRET_KEY provided in environment. Auto-generated secure key for session.")
            return generated
        return v

    # ─── CORS Policy Allowed Origins ──────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://medisphere-ai.vercel.app",
        "https://medisphere-ai.onrender.com",
        # NOTE: Never add "*" here — it conflicts with allow_credentials=True
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # ─── AI Agent Execution Engine Configuration ──────────────────────────────────
    AGENT_RUN_INTERVAL_SECONDS: int = 30  # Interval between agent analysis cycles
    AGENT_TIMEOUT_SECONDS: int = 60       # Maximum execution time allowed per agent step

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global immutable settings instance
settings = Settings()

