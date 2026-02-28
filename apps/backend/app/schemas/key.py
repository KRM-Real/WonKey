from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ApiKeyCreateOut(BaseModel):
    id: UUID
    project_id: UUID
    key_prefix: str
    status: str
    created_at: datetime
    raw_key: str
    
class ApiKeyOut(BaseModel):
    id: UUID
    project_id:UUID
    key_prefix: str
    status: str
    created_at: datetime
    last_used_at: datetime | None = None