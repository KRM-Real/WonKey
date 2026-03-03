from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings


def _extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        return token or None
    return None


def _is_admin_protected_path(path: str) -> bool:
    protected = [
        p.strip() for p in settings.ADMIN_PROTECTED_PATH_PREFIXES.split(",") if p.strip()
    ]
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in protected)


class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not _is_admin_protected_path(request.url.path):
            return await call_next(request)

        if not settings.ADMIN_API_KEY:
            return JSONResponse(
                status_code=500, content={"detail": "ADMIN_API_KEY is not configured"}
            )

        provided_key = _extract_bearer(request) or request.headers.get("X-Admin-Key")
        if provided_key != settings.ADMIN_API_KEY:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

        user_id = request.headers.get("X-User-Id")
        if not user_id:
            return JSONResponse(
                status_code=401, content={"detail": "Missing user context"}
            )

        request.state.is_admin = True
        request.state.admin_user_id = user_id
        return await call_next(request)
