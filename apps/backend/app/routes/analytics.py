from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request
from app.schemas.analytics import AnalyticsOverviewOut, AnalyticsTimeseriesOut
from app.services.analytics_service import (
    get_analytics_overview,
    get_analytics_timeseries,
)
from app.utils.admin_context import require_admin_user_id

router = APIRouter(prefix="/v1/projects", tags=["analytics"])


@router.get("/{project_id}/analytics/overview", response_model=AnalyticsOverviewOut)
def overview(
    request: Request,
    project_id: str,
    from_: datetime | None = Query(default=None, alias="from"),
    to: datetime | None = Query(default=None),
):
    try:
        user_id = require_admin_user_id(request)
        return get_analytics_overview(
            project_id=project_id, user_id=user_id, from_ts=from_, to_ts=to
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}/analytics/timeseries", response_model=AnalyticsTimeseriesOut)
def timeseries(
    request: Request,
    project_id: str,
    bucket: str = Query(default="hour"),
    from_: datetime | None = Query(default=None, alias="from"),
    to: datetime | None = Query(default=None),
):
    try:
        user_id = require_admin_user_id(request)
        return get_analytics_timeseries(
            project_id=project_id,
            user_id=user_id,
            bucket=bucket,
            from_ts=from_,
            to_ts=to,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
