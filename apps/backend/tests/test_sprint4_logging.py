from datetime import datetime, timezone
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.request_logger import RequestLoggerMiddleware
from app.routes.logs import router as logs_router


class _IdentityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.api_key = SimpleNamespace(
            project_id=str(uuid4()),
            key_id=str(uuid4()),
        )
        return await call_next(request)


class _RateLimitBlockMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})


class Sprint4LoggingTests(TestCase):
    def test_logger_writes_log_for_allowed_request(self):
        app = FastAPI()
        app.add_middleware(RequestLoggerMiddleware)
        app.add_middleware(_IdentityMiddleware)

        @app.get("/v1/ok")
        def ok():
            return {"status": "ok"}

        with patch("app.middleware.request_logger.create_log") as create_log_mock:
            client = TestClient(app)
            resp = client.get("/v1/ok", headers={"User-Agent": "unittest-agent"})

            self.assertEqual(resp.status_code, 200)
            create_log_mock.assert_called_once()
            kwargs = create_log_mock.call_args.kwargs
            self.assertEqual(kwargs["method"], "GET")
            self.assertEqual(kwargs["path"], "/v1/ok")
            self.assertEqual(kwargs["status_code"], 200)
            self.assertIn("latency_ms", kwargs)
            self.assertIsNotNone(kwargs["project_id"])
            self.assertIsNotNone(kwargs["key_id"])

    def test_logger_does_not_write_when_rate_limit_blocks(self):
        app = FastAPI()
        app.add_middleware(RequestLoggerMiddleware)
        app.add_middleware(_RateLimitBlockMiddleware)
        app.add_middleware(_IdentityMiddleware)

        @app.get("/v1/blocked")
        def blocked():
            return {"status": "ok"}

        with patch("app.middleware.request_logger.create_log") as create_log_mock:
            client = TestClient(app)
            resp = client.get("/v1/blocked")

            self.assertEqual(resp.status_code, 429)
            create_log_mock.assert_not_called()

    def test_logs_endpoint_passes_filters_to_service(self):
        app = FastAPI()
        app.include_router(logs_router)
        project_id = str(uuid4())

        expected_row = {
            "id": str(uuid4()),
            "project_id": project_id,
            "key_id": str(uuid4()),
            "method": "GET",
            "path": "/v1/demo",
            "status_code": 200,
            "latency_ms": 12,
            "ip": "127.0.0.1",
            "user_agent": "unittest-agent",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        with patch("app.routes.logs.list_logs", return_value=[expected_row]) as list_logs_mock:
            client = TestClient(app)
            resp = client.get(
                f"/v1/projects/{project_id}/logs",
                params={
                    "status": "200",
                    "path": "/v1/demo",
                    "from": "2026-03-01T00:00:00Z",
                    "to": "2026-03-03T00:00:00Z",
                    "limit": "25",
                },
            )

            self.assertEqual(resp.status_code, 200)
            self.assertEqual(len(resp.json()), 1)
            self.assertEqual(resp.json()[0]["path"], "/v1/demo")

            list_logs_mock.assert_called_once()
            kwargs = list_logs_mock.call_args.kwargs
            self.assertEqual(kwargs["project_id"], project_id)
            self.assertEqual(kwargs["status_code"], 200)
            self.assertEqual(kwargs["path"], "/v1/demo")
            self.assertEqual(kwargs["limit"], 25)
            self.assertEqual(kwargs["from_ts"].isoformat(), "2026-03-01T00:00:00+00:00")
            self.assertEqual(kwargs["to_ts"].isoformat(), "2026-03-03T00:00:00+00:00")
