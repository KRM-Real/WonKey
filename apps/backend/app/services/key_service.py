from app.db.supabase import get_supabase
from app.core.security import generate_raw_api_key, api_key_prefix, hash_api_key
from typing import cast, Dict, Any

def create_key(project_id: str):
    sb = get_supabase()
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

    row = cast(Dict[str, Any], res.data[0])

    row.pop("key_hash", None) 
    row["raw_key"] = raw

    return row

def list_keys(project_id: str):
    sb = get_supabase()
    res = sb.table("api_keys") \
        .select("id, project_id, key_prefix, status, created_at, last_used_at") \
        .eq("project_id", project_id) \
        .order("created_at", desc=True) \
        .execute()

    return res.data

def revoke_key(key_id: str):
    sb = get_supabase()
    res = sb.table("api_keys").update({"status": "revoked"}).eq("id", key_id).execute()
    return res.data[0] if res.data else None