from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings
from app.db.supabase import get_supabase


def _assert_project_in_default_org(project_id: str) -> None:
    sb = get_supabase()
    proj = (
        sb.table("projects")
        .select("id, org_id")
        .eq("id", project_id)
        .maybe_single()
        .execute()
    )

    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj.data["org_id"] != settings.DEFAULT_ORG_ID:
        raise HTTPException(status_code=403, detail="Forbidden")


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
    status_code: int | None = None,
    path: str | None = None,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    limit: int | None = None,
):
    _assert_project_in_default_org(project_id)

    resolved_limit = limit if limit is not None else settings.LOGS_DEFAULT_LIMIT
    resolved_limit = min(max(resolved_limit, 1), settings.LOGS_MAX_LIMIT)

    sb = get_supabase()
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
