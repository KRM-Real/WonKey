from app.db.supabase import get_supabase
from app.core.config import settings

def create_project(name:str):
    sb = get_supabase()
    if not settings.DEFAULT_ORG_ID:
        raise RuntimeError("DEFAULT_ORG_ID is mising in env.")
    res = sb.table("projects").insert({"org_id": settings.DEFAULT_ORG_ID, "name":name}).execute()
    return res.data[0]

def list_projects():
    sb = get_supabase()
    if not settings.DEFAULT_ORG_ID:
        raise RuntimeError("DEFAULT_ORG_ID is missing in env.")
    res = sb.table("projects").select("*").eq("org_id", settings.DEFAULT_ORG_ID).order("created_at", desc=True).execute()
    return res.data