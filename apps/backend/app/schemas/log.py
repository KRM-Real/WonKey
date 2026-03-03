from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class RequestLogOut(BaseModel):
    id: UUID
    project_id: UUID
    key_id: UUID | None = None
    method: str
    path: str
    status_code: int
    latency_ms: int
    ip: str | None = None
    user_agent: str | None = None
    created_at: datetime
