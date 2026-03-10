from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENV: str = "dev"
    API_NAME: str = "WonKey API"
    API_VERSION: str = "0.1.0"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DEFAULT_ORG_ID: str = ""
    DEV_DISABLE_ORG_MEMBERSHIP_CHECKS: bool = False
    API_KEY_HMAC_SECRET: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: str = "http://localhost:3000"
    ADMIN_API_KEY: str = ""
    ADMIN_PROTECTED_PATH_PREFIXES: str = "/v1/projects,/v1/keys"

    API_KEY_PEPPER: str = "change-me"               # secret server-side string
    API_KEY_PREFIX_LEN: int = 10                    # e.g. len("wk_liveNkc")
    API_KEY_CACHE_TTL_SECONDS: int = 180
    API_KEY_AUTH_EXEMPT_PATHS: str = "/health,/health/redis,/docs,/redoc,/openapi.json"

    RATE_LIMIT_DEFAULT_RPM: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_DEFAULT_BURST: int = 0
    RATE_LIMIT_EXEMPT_PATHS: str = "/health,/health/redis,/docs,/redoc,/openapi.json"
    REQUEST_LOG_EXEMPT_PATHS: str = "/health,/health/redis,/docs,/redoc,/openapi.json"
    REQUEST_LOG_SAMPLE_EVERY_N: int = 1
    LOGS_DEFAULT_LIMIT: int = 100
    LOGS_MAX_LIMIT: int = 500

    @field_validator("DEFAULT_ORG_ID", mode="before")
    @classmethod
    def _sanitize_default_org_id(cls, v: str) -> str:
        if not v:
            return ""
        return str(v).strip().split()[0]

    @field_validator("ENV", mode="before")
    @classmethod
    def _sanitize_env(cls, v: str) -> str:
        return str(v or "dev").strip().lower()

    @model_validator(mode="after")
    def _validate_runtime_requirements(self):
        is_dev = self.ENV == "dev"
        required_secret_fields = {
            "SUPABASE_URL": self.SUPABASE_URL,
            "SUPABASE_SERVICE_ROLE_KEY": self.SUPABASE_SERVICE_ROLE_KEY,
            "API_KEY_HMAC_SECRET": self.API_KEY_HMAC_SECRET,
            "ADMIN_API_KEY": self.ADMIN_API_KEY,
        }

        if not is_dev:
            missing = [name for name, value in required_secret_fields.items() if not str(value).strip()]
            if missing:
                missing_csv = ", ".join(missing)
                raise ValueError(f"Missing required settings for {self.ENV}: {missing_csv}")

            if self.API_KEY_PEPPER.strip() == "change-me":
                raise ValueError("API_KEY_PEPPER must be set to a non-default secret outside dev")

        if self.DEV_DISABLE_ORG_MEMBERSHIP_CHECKS and not is_dev:
            raise ValueError("DEV_DISABLE_ORG_MEMBERSHIP_CHECKS can only be enabled in dev")

        if self.DEV_DISABLE_ORG_MEMBERSHIP_CHECKS and not self.DEFAULT_ORG_ID:
            raise ValueError("DEFAULT_ORG_ID is required when DEV_DISABLE_ORG_MEMBERSHIP_CHECKS=true")

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()
