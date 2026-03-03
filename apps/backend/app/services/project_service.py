from app.db.supabase import get_supabase
from app.services.authz_service import get_user_org_ids, resolve_user_org_for_creation


def create_project(name: str, user_id: str, org_id: str | None = None):
    sb = get_supabase()
    resolved_org = resolve_user_org_for_creation(sb, user_id, preferred_org_id=org_id)
    res = sb.table("projects").insert({"org_id": resolved_org, "name": name}).execute()
    return res.data[0]


def list_projects(user_id: str):
    sb = get_supabase()
    org_ids = get_user_org_ids(sb, user_id)
    if not org_ids:
        return []
    res = (
        sb.table("projects")
        .select("*")
        .in_("org_id", org_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data
