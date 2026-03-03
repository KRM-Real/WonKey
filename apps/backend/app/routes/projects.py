from fastapi import APIRouter, HTTPException, Request
from app.schemas.project import ProjectCreate
from app.services.project_service import create_project, list_projects
from app.utils.admin_context import require_admin_user_id

router = APIRouter(prefix="/v1/projects", tags=["projects"])

@router.post("")
def create(payload: ProjectCreate, request: Request):
    try:
        user_id = require_admin_user_id(request)
        return create_project(payload.name, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
def list_all(request: Request):
    user_id = require_admin_user_id(request)
    return list_projects(user_id=user_id)
