from fastapi import APIRouter, HTTPException, Request
from app.schemas.limit import RateLimitRuleOut, RateLimitRuleUpdate
from app.services.rate_limit_service import (
    get_project_rate_limit_rule,
    upsert_project_rate_limit_rule,
)
from app.utils.admin_context import require_admin_user_id

router = APIRouter(prefix="/v1/projects", tags=["limits"])


@router.get("/{project_id}/limits", response_model=RateLimitRuleOut)
def get_limits(project_id: str, request: Request):
    try:
        user_id = require_admin_user_id(request)
        defaults = get_project_rate_limit_rule(project_id)
        return upsert_project_rate_limit_rule(
            project_id=project_id,
            user_id=user_id,
            requests_per_minute=defaults["requests_per_minute"],
            window_seconds=defaults["window_seconds"],
            burst=defaults["burst"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{project_id}/limits", response_model=RateLimitRuleOut)
def update_limits(project_id: str, payload: RateLimitRuleUpdate, request: Request):
    try:
        user_id = require_admin_user_id(request)
        return upsert_project_rate_limit_rule(
            project_id=project_id,
            user_id=user_id,
            requests_per_minute=payload.requests_per_minute,
            window_seconds=payload.window_seconds,
            burst=payload.burst,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
