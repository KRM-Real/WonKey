from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request
from app.schemas.log import RequestLogOut
from app.services.log_service import list_logs
from app.utils.admin_context import require_admin_user_id

router = APIRouter(prefix="/v1/projects", tags=["logs"])


@router.get("/{project_id}/logs", response_model=list[RequestLogOut])
def get_logs(
    request: Request,
    project_id: str,
    status: int | None = Query(default=None),
    path: str | None = Query(default=None),
    from_: datetime | None = Query(default=None, alias="from"),
    to: datetime | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
):
    try:
        user_id = require_admin_user_id(request)
        return list_logs(
            project_id=project_id,
            user_id=user_id,
            status_code=status,
            path=path,
            from_ts=from_,
            to_ts=to,
            limit=limit,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
