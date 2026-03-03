from typing import Optional
from pydantic import BaseModel
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.services.key_service import get_key_record_by_raw, touch_key_last_used


class ApiKeyIdentity(BaseModel):
    key_id: str
    org_id: str
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


def _is_exempt_path(path: str) -> bool:
    exempt_paths = [
        p.strip() for p in settings.API_KEY_AUTH_EXEMPT_PATHS.split(",") if p.strip()
    ]
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in exempt_paths)


class ApiKeyAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if getattr(request.state, "is_admin", False):
            return await call_next(request)

        if _is_exempt_path(request.url.path):
            return await call_next(request)

        raw_key = extract_raw_api_key(request)
        if not raw_key:
            return JSONResponse(status_code=401, content={"detail": "Missing API key"})

        record = get_key_record_by_raw(raw_key)
        if not record:
            return JSONResponse(status_code=401, content={"detail": "Invalid API key"})
        if not record.get("org_id") or not record.get("project_id") or not record.get("id"):
            return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

        if record.get("status") != "active":
            return JSONResponse(status_code=401, content={"detail": "Revoked API key"})

        identity = ApiKeyIdentity(
            key_id=record["id"],
            org_id=record["org_id"],
            project_id=record["project_id"],
            key_prefix=record["key_prefix"],
            status=record["status"],
        )
        request.state.api_key = identity
        request.state.org_id = identity.org_id
        request.state.project_id = identity.project_id
        request.state.key_id = identity.key_id
        touch_key_last_used(identity.key_id)

        return await call_next(request)
