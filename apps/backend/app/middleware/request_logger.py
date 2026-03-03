import random
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.services.log_service import create_log


def _is_exempt_path(path: str) -> bool:
    exempt_paths = [
        p.strip() for p in settings.REQUEST_LOG_EXEMPT_PATHS.split(",") if p.strip()
    ]
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in exempt_paths)


def _should_sample() -> bool:
    every_n = max(settings.REQUEST_LOG_SAMPLE_EVERY_N, 1)
    if every_n == 1:
        return True
    return random.randint(1, every_n) == 1


def _get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if _is_exempt_path(request.url.path):
            return await call_next(request)

        started = time.perf_counter()
        response = await call_next(request)

        identity = getattr(request.state, "api_key", None)
        if identity is None or not _should_sample():
            return response

        latency_ms = int((time.perf_counter() - started) * 1000)
        try:
            create_log(
                project_id=identity.project_id,
                key_id=identity.key_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                latency_ms=latency_ms,
                ip=_get_client_ip(request),
                user_agent=request.headers.get("User-Agent"),
            )
        except Exception:
            pass
        return response
