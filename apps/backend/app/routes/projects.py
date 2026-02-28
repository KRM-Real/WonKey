from fastapi import APIRouter, HTTPException
from app.schemas.project import ProjectCreate
from app.services.project_service import create_project, list_projects

router = APIRouter(prefix="/v1/projects", tags=["projects"])

@router.post("")
def create(payload: ProjectCreate):
    try:
        return create_project(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
def list_all():
    return list_projects()