from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENV: str = "dev"
    API_NAME: str = "WonKey API"
    API_VERSION: str = "0.1.0"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DEFAULT_ORG_ID: str = ""
    API_KEY_HMAC_SECRET: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: str = "http://localhost:3000"

    API_KEY_PEPPER: str = "change-me"               # secret server-side string
    API_KEY_PREFIX_LEN: int = 10                    # e.g. len("wk_liveNkc")
    API_KEY_CACHE_TTL_SECONDS: int = 180
    API_KEY_AUTH_EXEMPT_PATHS: str = "/health,/health/redis,/debug/env,/docs,/redoc,/openapi.json"

    RATE_LIMIT_DEFAULT_RPM: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_EXEMPT_PATHS: str = "/health,/health/redis,/debug/env,/docs,/redoc,/openapi.json"


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()
