from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    
class ProjectOut(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    created_at: datetime