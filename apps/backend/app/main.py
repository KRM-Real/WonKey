from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.redis import get_redis
from app.routes.projects import router as projects_router
from app.routes.keys import router as keys_router

app = FastAPI(title=settings.API_NAME, version=settings.API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/debug/env")
def debug_env():
    return {
        "supabase_url": settings.SUPABASE_URL,
        "supabase_url_len": len(settings.SUPABASE_URL or ""),
        "has_service_role_key": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
        "redis_url": settings.REDIS_URL,
    }