from fastapi import APIRouter, Request

router = APIRouter(prefix="/v1/test", tags=["test"])


@router.get("/auth-check")
def auth_check(request: Request):
    identity = getattr(request.state, "api_key", None)
    return {
        "ok": True,
        "auth": {
            "key_id": identity.key_id if identity else None,
            "project_id": identity.project_id if identity else None,
            "org_id": identity.org_id if identity else None,
            "key_prefix": identity.key_prefix if identity else None,
            "status": identity.status if identity else None,
        },
    }
