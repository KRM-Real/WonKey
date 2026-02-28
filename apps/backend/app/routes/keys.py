from fastapi import APIRouter, HTTPException
from app.services.key_service import create_key, list_keys, revoke_key
from app.schemas.key import ApiKeyCreateOut, ApiKeyOut  # ✅ add this

router = APIRouter(prefix="/v1", tags=["keys"])

@router.post("/projects/{project_id}/keys", response_model=ApiKeyCreateOut)  # ✅
def create(project_id: str):
    try:
        return create_key(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects/{project_id}/keys", response_model=list[ApiKeyOut])  # ✅
def list_all(project_id: str):
    return list_keys(project_id)

@router.post("/keys/{key_id}/revoke")
def revoke(key_id: str):
    row = revoke_key(key_id)
    if not row:
        raise HTTPException(status_code=404, detail="Key not found")
    return row