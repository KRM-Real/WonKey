from typing import Optional
from pydantic import BaseModel
from fastapi import Request


class ApiKeyIdentity(BaseModel):
    key_id: str
    project_id: str
    key_prefix: str
    status: str = "active"


def extract_raw_api_key(request: Request) -> Optional[str]:
    """
    Accept either:
      - Authorization: Bearer <key>
      - X-API-Key: <key>
    """
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        return token or None

    x_key = request.headers.get("X-API-Key")
    if x_key:
        x_key = x_key.strip()
        return x_key or None

    return None