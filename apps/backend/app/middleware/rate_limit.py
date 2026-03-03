from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings
from app.services.rate_limit_service import check_and_increment_rate_limit


def _is_exempt_path(path: str) -> bool:
    exempt_paths = [
        p.strip() for p in settings.RATE_LIMIT_EXEMPT_PATHS.split(",") if p.strip()
    ]
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in exempt_paths)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if getattr(request.state, "is_admin", False):
            return await call_next(request)

        if _is_exempt_path(request.url.path):
            return await call_next(request)

        identity = getattr(request.state, "api_key", None)
        if identity is None:
            return await call_next(request)

        result = check_and_increment_rate_limit(
            project_id=identity.project_id,
            key_id=identity.key_id,
        )
        headers = {
            "X-RateLimit-Limit": str(result.limit),
            "X-RateLimit-Remaining": str(result.remaining),
            "X-RateLimit-Reset": str(result.reset_after_seconds),
        }

        if not result.allowed:
            headers["Retry-After"] = str(result.reset_after_seconds)
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
                headers=headers,
            )

        response = await call_next(request)
        for k, v in headers.items():
            response.headers[k] = v
        return response
