from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.redis import get_redis
from app.middleware.api_key_auth import ApiKeyAuthMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.routes.projects import router as projects_router
from app.routes.keys import router as keys_router
from app.routes.logs import router as logs_router

app = FastAPI(title=settings.API_NAME, version=settings.API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware execution order for requests:
# 1) ApiKeyAuthMiddleware
# 2) RateLimitMiddleware
# 3) RequestLoggerMiddleware
app.add_middleware(RequestLoggerMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ApiKeyAuthMiddleware)

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

@app.get("/debug/env")
def debug_env():
    return {
        "supabase_url": settings.SUPABASE_URL,
        "supabase_url_len": len(settings.SUPABASE_URL or ""),
        "has_service_role_key": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
        "redis_url": settings.REDIS_URL,
    }
