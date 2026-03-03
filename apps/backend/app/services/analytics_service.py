from datetime import datetime, timedelta, timezone
from math import ceil
from fastapi import HTTPException
from app.db.supabase import get_supabase
from app.services.authz_service import assert_user_project_access


def _normalize_window(
    from_ts: datetime | None, to_ts: datetime | None
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if from_ts is None and to_ts is None:
        return now - timedelta(hours=24), now
    if from_ts is None and to_ts is not None:
        return to_ts - timedelta(hours=24), to_ts
    if from_ts is not None and to_ts is None:
        return from_ts, now

    if from_ts is None or to_ts is None:
        raise HTTPException(status_code=400, detail="Invalid time window")
    if from_ts > to_ts:
        raise HTTPException(status_code=400, detail="'from' must be <= 'to'")
    return from_ts, to_ts


def _fetch_logs(project_id: str, from_ts: datetime, to_ts: datetime) -> list[dict]:
    sb = get_supabase()
    res = (
        sb.table("request_logs")
        .select("created_at, status_code, latency_ms")
        .eq("project_id", project_id)
        .gte("created_at", from_ts.isoformat())
        .lte("created_at", to_ts.isoformat())
        .order("created_at", desc=False)
        .execute()
    )
    return res.data or []


def _p95(values: list[int]) -> int:
    if not values:
        return 0
    ordered = sorted(values)
    rank = max(1, ceil(len(ordered) * 0.95))
    return ordered[rank - 1]


def _build_overview(logs: list[dict]) -> dict:
    total = len(logs)
    errors = sum(1 for row in logs if int(row["status_code"]) >= 400)
    latencies = [int(row["latency_ms"]) for row in logs]
    avg_latency = int(round(sum(latencies) / total)) if total else 0

    return {
        "total_requests": total,
        "total_errors": errors,
        "error_rate": round((errors / total) * 100, 2) if total else 0.0,
        "avg_latency_ms": avg_latency,
        "p95_latency_ms": _p95(latencies),
    }


def _hour_floor(ts: datetime) -> datetime:
    return ts.replace(minute=0, second=0, microsecond=0)


def _parse_db_ts(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _build_hourly_timeseries(
    logs: list[dict], from_ts: datetime, to_ts: datetime
) -> list[dict]:
    start = _hour_floor(from_ts.astimezone(timezone.utc))
    end = _hour_floor(to_ts.astimezone(timezone.utc))

    buckets: dict[datetime, dict] = {}
    cursor = start
    while cursor <= end:
        buckets[cursor] = {
            "ts": cursor,
            "requests": 0,
            "errors": 0,
            "latencies": [],
        }
        cursor += timedelta(hours=1)

    for row in logs:
        ts = _hour_floor(_parse_db_ts(row["created_at"]))
        bucket = buckets.get(ts)
        if bucket is None:
            continue
        bucket["requests"] += 1
        if int(row["status_code"]) >= 400:
            bucket["errors"] += 1
        bucket["latencies"].append(int(row["latency_ms"]))

    points = []
    for ts in sorted(buckets.keys()):
        item = buckets[ts]
        requests = item["requests"]
        errors = item["errors"]
        latencies = item["latencies"]
        avg_latency = int(round(sum(latencies) / requests)) if requests else 0
        points.append(
            {
                "ts": ts,
                "requests": requests,
                "errors": errors,
                "error_rate": round((errors / requests) * 100, 2) if requests else 0.0,
                "avg_latency_ms": avg_latency,
                "p95_latency_ms": _p95(latencies),
            }
        )
    return points


def get_analytics_overview(
    *,
    project_id: str,
    user_id: str,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
) -> dict:
    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)
    window_from, window_to = _normalize_window(from_ts, to_ts)
    logs = _fetch_logs(project_id, window_from, window_to)
    overview = _build_overview(logs)
    overview["window_start"] = window_from
    overview["window_end"] = window_to
    return overview


def get_analytics_timeseries(
    *,
    project_id: str,
    user_id: str,
    bucket: str = "hour",
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
) -> dict:
    if bucket != "hour":
        raise HTTPException(status_code=400, detail="Only bucket=hour is supported")

    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)
    window_from, window_to = _normalize_window(from_ts, to_ts)
    logs = _fetch_logs(project_id, window_from, window_to)
    return {
        "bucket": "hour",
        "window_start": window_from,
        "window_end": window_to,
        "points": _build_hourly_timeseries(logs, window_from, window_to),
    }
