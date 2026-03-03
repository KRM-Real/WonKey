from datetime import datetime, timezone
from unittest import TestCase
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.analytics import router as analytics_router
from app.services import analytics_service as svc


class Sprint5AnalyticsTests(TestCase):
    def test_build_overview_metrics(self):
        rows = [
            {"status_code": 200, "latency_ms": 100},
            {"status_code": 201, "latency_ms": 80},
            {"status_code": 500, "latency_ms": 120},
            {"status_code": 404, "latency_ms": 60},
        ]

        overview = svc._build_overview(rows)
        self.assertEqual(overview["total_requests"], 4)
        self.assertEqual(overview["total_errors"], 2)
        self.assertEqual(overview["error_rate"], 50.0)
        self.assertEqual(overview["avg_latency_ms"], 90)
        self.assertEqual(overview["p95_latency_ms"], 120)

    def test_build_hourly_timeseries_metrics(self):
        from_ts = datetime(2026, 3, 3, 10, 10, tzinfo=timezone.utc)
        to_ts = datetime(2026, 3, 3, 12, 5, tzinfo=timezone.utc)
        rows = [
            {
                "created_at": "2026-03-03T10:20:00Z",
                "status_code": 200,
                "latency_ms": 100,
            },
            {
                "created_at": "2026-03-03T10:50:00Z",
                "status_code": 500,
                "latency_ms": 200,
            },
            {
                "created_at": "2026-03-03T12:01:00Z",
                "status_code": 200,
                "latency_ms": 50,
            },
        ]

        points = svc._build_hourly_timeseries(rows, from_ts, to_ts)
        self.assertEqual(len(points), 3)
        self.assertEqual(points[0]["ts"].isoformat(), "2026-03-03T10:00:00+00:00")
        self.assertEqual(points[0]["requests"], 2)
        self.assertEqual(points[0]["errors"], 1)
        self.assertEqual(points[0]["error_rate"], 50.0)
        self.assertEqual(points[1]["requests"], 0)
        self.assertEqual(points[2]["requests"], 1)
        self.assertEqual(points[2]["avg_latency_ms"], 50)

    def test_overview_route_passes_filters(self):
        app = FastAPI()
        app.include_router(analytics_router)
        project_id = str(uuid4())

        mock_payload = {
            "total_requests": 10,
            "total_errors": 2,
            "error_rate": 20.0,
            "avg_latency_ms": 40,
            "p95_latency_ms": 90,
            "window_start": datetime(2026, 3, 1, 0, 0, tzinfo=timezone.utc),
            "window_end": datetime(2026, 3, 3, 0, 0, tzinfo=timezone.utc),
        }

        with patch(
            "app.routes.analytics.get_analytics_overview", return_value=mock_payload
        ) as overview_mock:
            client = TestClient(app)
            resp = client.get(
                f"/v1/projects/{project_id}/analytics/overview",
                params={"from": "2026-03-01T00:00:00Z", "to": "2026-03-03T00:00:00Z"},
            )

            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.json()["total_requests"], 10)
            overview_mock.assert_called_once()
            kwargs = overview_mock.call_args.kwargs
            self.assertEqual(kwargs["project_id"], project_id)
            self.assertEqual(kwargs["from_ts"].isoformat(), "2026-03-01T00:00:00+00:00")
            self.assertEqual(kwargs["to_ts"].isoformat(), "2026-03-03T00:00:00+00:00")

    def test_timeseries_route_rejects_invalid_bucket(self):
        app = FastAPI()
        app.include_router(analytics_router)
        project_id = str(uuid4())

        client = TestClient(app)
        resp = client.get(
            f"/v1/projects/{project_id}/analytics/timeseries",
            params={"bucket": "day"},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["detail"], "Only bucket=hour is supported")
