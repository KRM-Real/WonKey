from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.redis import get_redis
from fastapi import HTTPException
from app.middleware.admin_auth import AdminAuthMiddleware
from app.middleware.api_key_auth import ApiKeyAuthMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.routes.projects import router as projects_router
from app.routes.keys import router as keys_router
from app.routes.logs import router as logs_router
from app.routes.analytics import router as analytics_router
from app.routes.limits import router as limits_router
from app.routes.health import router as health_router

app = FastAPI(title=settings.API_NAME, version=settings.API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware execution order for requests:
# 1) AdminAuthMiddleware
# 2) ApiKeyAuthMiddleware
# 3) RateLimitMiddleware
# 4) RequestLoggerMiddleware
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ApiKeyAuthMiddleware)
app.add_middleware(AdminAuthMiddleware)

@app.get("/health")
def health():
    return {"status": "ok", "service": settings.API_NAME, "env": settings.ENV}

@app.get("/health/redis")
def health_redis():
    r = get_redis()
    r.ping()
    return {"status": "ok", "redis": "up"}

app.include_router(projects_router)
app.include_router(keys_router)
app.include_router(logs_router)
app.include_router(analytics_router)
app.include_router(limits_router)
app.include_router(health_router)

@app.get("/debug/env")
def debug_env():
    if settings.ENV != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "env": settings.ENV,
        "api_name": settings.API_NAME,
        "redis_configured": bool(settings.REDIS_URL),
    }
