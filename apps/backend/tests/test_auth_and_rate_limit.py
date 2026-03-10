from unittest import TestCase
from unittest.mock import patch

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.core.config import settings
from app.middleware.admin_auth import AdminAuthMiddleware
from app.middleware.api_key_auth import ApiKeyAuthMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


class AuthAndRateLimitTests(TestCase):
    def setUp(self):
        self._original_admin_api_key = settings.ADMIN_API_KEY
        self._original_admin_prefixes = settings.ADMIN_PROTECTED_PATH_PREFIXES
        self._original_api_key_exempt_paths = settings.API_KEY_AUTH_EXEMPT_PATHS
        self._original_rate_limit_exempt_paths = settings.RATE_LIMIT_EXEMPT_PATHS

        settings.ADMIN_API_KEY = "admin-secret"
        settings.ADMIN_PROTECTED_PATH_PREFIXES = "/v1/projects,/v1/keys"
        settings.API_KEY_AUTH_EXEMPT_PATHS = "/health,/health/redis,/docs,/redoc,/openapi.json"
        settings.RATE_LIMIT_EXEMPT_PATHS = "/health,/health/redis,/docs,/redoc,/openapi.json"

    def tearDown(self):
        settings.ADMIN_API_KEY = self._original_admin_api_key
        settings.ADMIN_PROTECTED_PATH_PREFIXES = self._original_admin_prefixes
        settings.API_KEY_AUTH_EXEMPT_PATHS = self._original_api_key_exempt_paths
        settings.RATE_LIMIT_EXEMPT_PATHS = self._original_rate_limit_exempt_paths

    def test_admin_auth_rejects_missing_user_context(self):
        app = FastAPI()
        app.add_middleware(AdminAuthMiddleware)

        @app.get("/v1/projects")
        def projects():
            return {"ok": True}

        client = TestClient(app)
        resp = client.get("/v1/projects", headers={"X-Admin-Key": settings.ADMIN_API_KEY})

        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["detail"], "Missing user context")

    def test_admin_auth_allows_protected_route_with_valid_headers(self):
        app = FastAPI()
        app.add_middleware(AdminAuthMiddleware)

        @app.get("/v1/projects")
        def projects(request: Request):
            return {
                "ok": True,
                "is_admin": getattr(request.state, "is_admin", False),
                "admin_user_id": getattr(request.state, "admin_user_id", None),
            }

        client = TestClient(app)
        resp = client.get(
            "/v1/projects",
            headers={
                "Authorization": f"Bearer {settings.ADMIN_API_KEY}",
                "X-User-Id": "user-123",
            },
        )

        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["is_admin"])
        self.assertEqual(resp.json()["admin_user_id"], "user-123")

    def test_api_key_auth_attaches_identity_from_bearer_token(self):
        app = FastAPI()
        app.add_middleware(ApiKeyAuthMiddleware)

        @app.get("/v1/protected")
        def protected(request: Request):
            identity = request.state.api_key
            return {
                "key_id": identity.key_id,
                "project_id": identity.project_id,
                "org_id": identity.org_id,
                "key_prefix": identity.key_prefix,
            }

        record = {
            "id": "key-1",
            "project_id": "project-1",
            "org_id": "org-1",
            "key_prefix": "wk_live123",
            "status": "active",
        }

        with patch("app.middleware.api_key_auth.get_key_record_by_raw", return_value=record) as get_key_mock, patch(
            "app.middleware.api_key_auth.touch_key_last_used"
        ) as touch_mock:
            client = TestClient(app)
            resp = client.get(
                "/v1/protected",
                headers={"Authorization": "Bearer wk_test_secret"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["key_id"], "key-1")
        get_key_mock.assert_called_once_with("wk_test_secret")
        touch_mock.assert_called_once_with("key-1")

    def test_api_key_auth_rejects_revoked_key(self):
        app = FastAPI()
        app.add_middleware(ApiKeyAuthMiddleware)

        @app.get("/v1/protected")
        def protected():
            return {"ok": True}

        record = {
            "id": "key-1",
            "project_id": "project-1",
            "org_id": "org-1",
            "key_prefix": "wk_live123",
            "status": "revoked",
        }

        with patch("app.middleware.api_key_auth.get_key_record_by_raw", return_value=record):
            client = TestClient(app)
            resp = client.get("/v1/protected", headers={"X-API-Key": "wk_test_secret"})

        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["detail"], "Revoked API key")

    def test_rate_limit_adds_headers_for_allowed_request(self):
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware)

        @app.middleware("http")
        async def attach_identity(request: Request, call_next):
            request.state.api_key = type(
                "Identity",
                (),
                {"project_id": "project-1", "key_id": "key-1"},
            )()
            return await call_next(request)

        @app.get("/v1/protected")
        def protected():
            return {"ok": True}

        result = type(
            "RateLimitResult",
            (),
            {
                "allowed": True,
                "limit": 100,
                "remaining": 99,
                "reset_after_seconds": 60,
            },
        )()

        with patch("app.middleware.rate_limit.check_and_increment_rate_limit", return_value=result) as rate_limit_mock:
            client = TestClient(app)
            resp = client.get("/v1/protected")

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers["X-RateLimit-Limit"], "100")
        self.assertEqual(resp.headers["X-RateLimit-Remaining"], "99")
        self.assertEqual(resp.headers["X-RateLimit-Reset"], "60")
        rate_limit_mock.assert_called_once_with(project_id="project-1", key_id="key-1")

    def test_rate_limit_blocks_when_limit_exceeded(self):
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware)

        @app.middleware("http")
        async def attach_identity(request: Request, call_next):
            request.state.api_key = type(
                "Identity",
                (),
                {"project_id": "project-1", "key_id": "key-1"},
            )()
            return await call_next(request)

        @app.get("/v1/protected")
        def protected():
            return {"ok": True}

        result = type(
            "RateLimitResult",
            (),
            {
                "allowed": False,
                "limit": 100,
                "remaining": 0,
                "reset_after_seconds": 42,
            },
        )()

        with patch("app.middleware.rate_limit.check_and_increment_rate_limit", return_value=result):
            client = TestClient(app)
            resp = client.get("/v1/protected")

        self.assertEqual(resp.status_code, 429)
        self.assertEqual(resp.json()["detail"], "Rate limit exceeded")
        self.assertEqual(resp.headers["Retry-After"], "42")
        self.assertEqual(resp.headers["X-RateLimit-Remaining"], "0")

    def test_rate_limit_fail_open_on_service_error(self):
        app = FastAPI()
        app.add_middleware(RateLimitMiddleware)

        @app.middleware("http")
        async def attach_identity(request: Request, call_next):
            request.state.api_key = type(
                "Identity",
                (),
                {"project_id": "project-1", "key_id": "key-1"},
            )()
            return await call_next(request)

        @app.get("/v1/protected")
        def protected():
            return JSONResponse({"ok": True})

        with patch("app.middleware.rate_limit.check_and_increment_rate_limit", side_effect=RuntimeError("redis down")):
            client = TestClient(app)
            resp = client.get("/v1/protected")

        self.assertEqual(resp.status_code, 200)
        self.assertNotIn("X-RateLimit-Limit", resp.headers)
