import time
from dataclasses import dataclass
from app.core.config import settings
from app.db.redis import get_redis
from app.db.supabase import get_supabase
from app.services.authz_service import assert_user_project_access


@dataclass
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after_seconds: int


def _default_rule(project_id: str) -> dict:
    return {
        "project_id": project_id,
        "requests_per_minute": settings.RATE_LIMIT_DEFAULT_RPM,
        "window_seconds": settings.RATE_LIMIT_WINDOW_SECONDS,
        "burst": settings.RATE_LIMIT_DEFAULT_BURST,
    }


def get_project_rate_limit_rule(project_id: str) -> dict:
    sb = get_supabase()
    res = (
        sb.table("rate_limit_rules")
        .select("project_id, requests_per_minute, window_seconds, burst, created_at, updated_at")
        .eq("project_id", project_id)
        .maybe_single()
        .execute()
    )
    if not res.data:
        return _default_rule(project_id)

    row = res.data
    rpm = row.get("requests_per_minute")
    window = row.get("window_seconds")
    burst = row.get("burst")
    return {
        "project_id": project_id,
        "requests_per_minute": rpm if isinstance(rpm, int) and rpm > 0 else settings.RATE_LIMIT_DEFAULT_RPM,
        "window_seconds": window if isinstance(window, int) and window > 0 else settings.RATE_LIMIT_WINDOW_SECONDS,
        "burst": burst if isinstance(burst, int) and burst >= 0 else settings.RATE_LIMIT_DEFAULT_BURST,
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def upsert_project_rate_limit_rule(
    project_id: str,
    user_id: str,
    requests_per_minute: int,
    window_seconds: int,
    burst: int,
) -> dict:
    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)
    res = (
        sb.table("rate_limit_rules")
        .upsert(
            {
                "project_id": project_id,
                "requests_per_minute": requests_per_minute,
                "window_seconds": window_seconds,
                "burst": burst,
            },
            on_conflict="project_id",
        )
        .execute()
    )
    if res.data:
        return res.data[0]
    return get_project_rate_limit_rule(project_id)


def check_and_increment_rate_limit(project_id: str, key_id: str) -> RateLimitResult:
    redis = get_redis()
    rule = get_project_rate_limit_rule(project_id)
    window = int(rule["window_seconds"])
    base_limit = int(rule["requests_per_minute"])
    burst = int(rule["burst"])
    limit = base_limit + burst
    bucket = int(time.time() // window)
    redis_key = f"ratelimit:{key_id}:{bucket}"

    count = redis.incr(redis_key)
    if count == 1:
        redis.expire(redis_key, window)

    ttl = redis.ttl(redis_key)
    if ttl < 0:
        redis.expire(redis_key, window)
        ttl = window

    remaining = max(limit - count, 0)
    return RateLimitResult(
        allowed=count <= limit,
        limit=limit,
        remaining=remaining,
        reset_after_seconds=ttl,
    )
