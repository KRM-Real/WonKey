import time
from dataclasses import dataclass
from app.core.config import settings
from app.db.redis import get_redis
from app.db.supabase import get_supabase


@dataclass
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_after_seconds: int


def _project_rpm_limit(project_id: str) -> int:
    sb = get_supabase()
    res = (
        sb.table("rate_limit_rules")
        .select("requests_per_minute")
        .eq("project_id", project_id)
        .maybe_single()
        .execute()
    )
    if not res.data:
        return settings.RATE_LIMIT_DEFAULT_RPM

    value = res.data.get("requests_per_minute")
    if not isinstance(value, int) or value <= 0:
        return settings.RATE_LIMIT_DEFAULT_RPM
    return value


def check_and_increment_rate_limit(project_id: str, key_id: str) -> RateLimitResult:
    redis = get_redis()
    window = settings.RATE_LIMIT_WINDOW_SECONDS
    limit = _project_rpm_limit(project_id)
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
