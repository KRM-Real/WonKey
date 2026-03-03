from fastapi import HTTPException
from app.core.config import settings


def get_user_org_ids(sb, user_id: str) -> list[str]:
    if settings.ENV == "dev" and settings.DEV_DISABLE_ORG_MEMBERSHIP_CHECKS:
        return [settings.DEFAULT_ORG_ID] if settings.DEFAULT_ORG_ID else []

    memberships = (
        sb.table("org_members").select("org_id").eq("user_id", user_id).execute().data or []
    )
    return [row["org_id"] for row in memberships if row.get("org_id")]


def resolve_user_org_for_creation(sb, user_id: str, preferred_org_id: str | None = None) -> str:
    org_ids = get_user_org_ids(sb, user_id)
    if not org_ids:
        raise HTTPException(status_code=403, detail="No organization membership")

    if preferred_org_id:
        if preferred_org_id not in org_ids:
            raise HTTPException(status_code=403, detail="Forbidden")
        return preferred_org_id

    return org_ids[0]


def assert_user_project_access(sb, user_id: str, project_id: str) -> dict:
    project = (
        sb.table("projects")
        .select("id, org_id")
        .eq("id", project_id)
        .maybe_single()
        .execute()
        .data
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    org_ids = get_user_org_ids(sb, user_id)
    if project["org_id"] not in org_ids:
        raise HTTPException(status_code=403, detail="Forbidden")

    return project


def assert_user_key_access(sb, user_id: str, key_id: str) -> dict:
    row = (
        sb.table("api_keys")
        .select("id, project_id, project:projects!inner(org_id)")
        .eq("id", key_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")

    project = row.get("project") or {}
    org_id = project.get("org_id")
    org_ids = get_user_org_ids(sb, user_id)
    if not org_id or org_id not in org_ids:
        raise HTTPException(status_code=403, detail="Forbidden")

    return row
