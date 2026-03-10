from datetime import datetime, timezone
from unittest import TestCase
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.keys import router as keys_router
from app.routes.limits import router as limits_router
from app.routes.projects import router as projects_router


class AdminRoutesTests(TestCase):
    def _client_with_router(self, router):
        app = FastAPI()
        app.include_router(router)
        return TestClient(app)

    def test_projects_list_requires_user_context(self):
        client = self._client_with_router(projects_router)
        resp = client.get("/v1/projects")

        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["detail"], "Missing user context")

    def test_projects_create_passes_name_and_user_id(self):
        client = self._client_with_router(projects_router)
        payload = {
            "id": "11111111-1111-1111-1111-111111111111",
            "org_id": "22222222-2222-2222-2222-222222222222",
            "name": "Demo Project",
            "created_at": datetime(2026, 3, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
        }

        with patch("app.routes.projects.create_project", return_value=payload) as create_project_mock:
            resp = client.post(
                "/v1/projects",
                json={"name": "Demo Project"},
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["name"], "Demo Project")
        create_project_mock.assert_called_once_with("Demo Project", user_id="user-123")

    def test_projects_create_maps_service_errors_to_bad_request(self):
        client = self._client_with_router(projects_router)

        with patch("app.routes.projects.create_project", side_effect=RuntimeError("duplicate project")):
            resp = client.post(
                "/v1/projects",
                json={"name": "Demo Project"},
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["detail"], "duplicate project")

    def test_keys_create_returns_raw_key_payload(self):
        client = self._client_with_router(keys_router)
        payload = {
            "id": "33333333-3333-3333-3333-333333333333",
            "project_id": "44444444-4444-4444-4444-444444444444",
            "key_prefix": "wk_live123",
            "status": "active",
            "created_at": datetime(2026, 3, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
            "raw_key": "wk_live_secret",
        }

        with patch("app.routes.keys.create_key", return_value=payload) as create_key_mock:
            resp = client.post(
                "/v1/projects/44444444-4444-4444-4444-444444444444/keys",
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["raw_key"], "wk_live_secret")
        create_key_mock.assert_called_once_with(
            "44444444-4444-4444-4444-444444444444",
            user_id="user-123",
        )

    def test_keys_list_maps_unexpected_errors_to_internal_server_error(self):
        client = self._client_with_router(keys_router)

        with patch("app.routes.keys.list_keys", side_effect=RuntimeError("db timeout")):
            resp = client.get(
                "/v1/projects/44444444-4444-4444-4444-444444444444/keys",
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 500)
        self.assertEqual(resp.json()["detail"], "List keys failed: db timeout")

    def test_keys_revoke_returns_not_found_when_service_returns_none(self):
        client = self._client_with_router(keys_router)

        with patch("app.routes.keys.revoke_key", return_value=None) as revoke_key_mock:
            resp = client.post(
                "/v1/keys/55555555-5555-5555-5555-555555555555/revoke",
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.json()["detail"], "Key not found")
        revoke_key_mock.assert_called_once_with(
            "55555555-5555-5555-5555-555555555555",
            user_id="user-123",
        )

    def test_limits_get_uses_defaults_from_service_and_upserts(self):
        client = self._client_with_router(limits_router)
        rule = {
            "project_id": "66666666-6666-6666-6666-666666666666",
            "requests_per_minute": 120,
            "window_seconds": 60,
            "burst": 20,
            "created_at": datetime(2026, 3, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
            "updated_at": datetime(2026, 3, 10, 12, 5, tzinfo=timezone.utc).isoformat(),
        }

        with patch(
            "app.routes.limits.get_project_rate_limit_rule",
            return_value={"requests_per_minute": 120, "window_seconds": 60, "burst": 20},
        ) as get_rule_mock, patch(
            "app.routes.limits.upsert_project_rate_limit_rule",
            return_value=rule,
        ) as upsert_mock:
            resp = client.get(
                "/v1/projects/66666666-6666-6666-6666-666666666666/limits",
                headers={"X-User-Id": "user-123"},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["requests_per_minute"], 120)
        get_rule_mock.assert_called_once_with("66666666-6666-6666-6666-666666666666")
        upsert_mock.assert_called_once_with(
            project_id="66666666-6666-6666-6666-666666666666",
            user_id="user-123",
            requests_per_minute=120,
            window_seconds=60,
            burst=20,
        )

    def test_limits_update_rejects_invalid_payload(self):
        client = self._client_with_router(limits_router)
        resp = client.put(
            "/v1/projects/66666666-6666-6666-6666-666666666666/limits",
            headers={"X-User-Id": "user-123"},
            json={"requests_per_minute": 0, "window_seconds": 60, "burst": 0},
        )

        self.assertEqual(resp.status_code, 422)

    def test_limits_update_passes_valid_payload_to_service(self):
        client = self._client_with_router(limits_router)
        rule = {
            "project_id": "66666666-6666-6666-6666-666666666666",
            "requests_per_minute": 90,
            "window_seconds": 30,
            "burst": 10,
            "created_at": datetime(2026, 3, 10, 12, 0, tzinfo=timezone.utc).isoformat(),
            "updated_at": datetime(2026, 3, 10, 12, 5, tzinfo=timezone.utc).isoformat(),
        }

        with patch("app.routes.limits.upsert_project_rate_limit_rule", return_value=rule) as upsert_mock:
            resp = client.put(
                "/v1/projects/66666666-6666-6666-6666-666666666666/limits",
                headers={"X-User-Id": "user-123"},
                json={"requests_per_minute": 90, "window_seconds": 30, "burst": 10},
            )

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["burst"], 10)
        upsert_mock.assert_called_once_with(
            project_id="66666666-6666-6666-6666-666666666666",
            user_id="user-123",
            requests_per_minute=90,
            window_seconds=30,
            burst=10,
        )
