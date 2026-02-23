from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.redis import get_redis

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