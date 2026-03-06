from datetime import datetime
from pydantic import BaseModel, Field


class RateLimitRuleOut(BaseModel):
    project_id: str
    requests_per_minute: int
    window_seconds: int
    burst: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RateLimitRuleUpdate(BaseModel):
    requests_per_minute: int = Field(ge=1, le=1_000_000)
    window_seconds: int = Field(ge=1, le=86_400)
    burst: int = Field(ge=0, le=1_000_000)
