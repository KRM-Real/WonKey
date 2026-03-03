from datetime import datetime
from app.core.config import settings
from app.db.supabase import get_supabase
from app.services.authz_service import assert_user_project_access


def create_log(
    *,
    project_id: str,
    key_id: str | None,
    method: str,
    path: str,
    status_code: int,
    latency_ms: int,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    sb = get_supabase()
    sb.table("request_logs").insert(
        {
            "project_id": project_id,
            "key_id": key_id,
            "method": method,
            "path": path,
            "status_code": status_code,
            "latency_ms": latency_ms,
            "ip": ip,
            "user_agent": user_agent,
        }
    ).execute()


def list_logs(
    *,
    project_id: str,
    user_id: str,
    status_code: int | None = None,
    path: str | None = None,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    limit: int | None = None,
):
    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)

    resolved_limit = limit if limit is not None else settings.LOGS_DEFAULT_LIMIT
    resolved_limit = min(max(resolved_limit, 1), settings.LOGS_MAX_LIMIT)

    query = (
        sb.table("request_logs")
        .select(
            "id, project_id, key_id, method, path, status_code, latency_ms, ip, user_agent, created_at"
        )
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .limit(resolved_limit)
    )

    if status_code is not None:
        query = query.eq("status_code", status_code)
    if path is not None:
        query = query.eq("path", path)
    if from_ts is not None:
        query = query.gte("created_at", from_ts.isoformat())
    if to_ts is not None:
        query = query.lte("created_at", to_ts.isoformat())

    res = query.execute()
    return res.data or []
