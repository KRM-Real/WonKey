from fastapi import APIRouter, HTTPException, Request
from app.services.key_service import create_key, list_keys, revoke_key
from app.schemas.key import ApiKeyCreateOut, ApiKeyOut
from app.utils.admin_context import require_admin_user_id

router = APIRouter(prefix="/v1", tags=["keys"])


@router.post("/projects/{project_id}/keys", response_model=ApiKeyCreateOut)
def create(project_id: str, request: Request):
    try:
        user_id = require_admin_user_id(request)
        return create_key(project_id, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/projects/{project_id}/keys", response_model=list[ApiKeyOut])
def list_all(project_id: str, request: Request):
    try:
        user_id = require_admin_user_id(request)
        return list_keys(project_id, user_id=user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List keys failed: {e}")


@router.post("/keys/{key_id}/revoke")
def revoke(key_id: str, request: Request):
    user_id = require_admin_user_id(request)
    row = revoke_key(key_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")
    return row
