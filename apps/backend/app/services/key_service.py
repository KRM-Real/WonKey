from app.db.supabase import get_supabase
from app.core.security import generate_raw_api_key, api_key_prefix, hash_api_key
from app.core.config import settings
from typing import cast, Dict, Any
from datetime import datetime, timezone
from app.services.authz_service import assert_user_key_access, assert_user_project_access


def create_key(project_id: str, user_id: str):
    
    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)
    
    raw = generate_raw_api_key()
    prefix = api_key_prefix(raw)
    key_hash = hash_api_key(raw)

    res = sb.table("api_keys").insert({
        "project_id": project_id,
        "key_prefix": prefix,
        "key_hash": key_hash,
        "status": "active",
    }).execute()

    if not res.data:
        raise RuntimeError("Failed to create API key.")

    row = cast(Dict[str, Any], res.data[0])

    row.pop("key_hash", None) 
    row["raw_key"] = raw

    return row


def list_keys(project_id: str, user_id: str):
    sb = get_supabase()
    assert_user_project_access(sb, user_id, project_id)
    
    res = sb.table("api_keys") \
        .select("id, project_id, key_prefix, status, created_at, last_used_at") \
        .eq("project_id", project_id) \
        .order("created_at", desc=True) \
        .execute()

    return res.data


def revoke_key(key_id: str, user_id: str):
    sb = get_supabase()
    assert_user_key_access(sb, user_id, key_id)
    res = sb.table("api_keys").update({"status": "revoked"}).eq("id", key_id).execute()
    return res.data[0] if res.data else None


def get_key_record_by_raw(raw_key: str) -> Dict[str, Any] | None:
    sb = get_supabase()
    prefix = api_key_prefix(raw_key, settings.API_KEY_PREFIX_LEN)
    key_hash = hash_api_key(raw_key)

    res = (
        sb.table("api_keys")
        .select("id, project_id, key_prefix, status, project:projects!inner(org_id)")
        .eq("key_prefix", prefix)
        .eq("key_hash", key_hash)
        .limit(1)
        .execute()
    )

    if not res.data:
        return None

    row = cast(Dict[str, Any], res.data[0])
    project = cast(Dict[str, Any], row.get("project") or {})
    row["org_id"] = project.get("org_id")
    return row


def touch_key_last_used(key_id: str) -> None:
    sb = get_supabase()
    sb.table("api_keys").update(
        {"last_used_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", key_id).execute()
