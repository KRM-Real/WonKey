from fastapi import HTTPException, Request


def require_admin_user_id(request: Request) -> str:
    user_id = getattr(request.state, "admin_user_id", None) or request.headers.get(
        "X-User-Id"
    )
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user context")
    return user_id
