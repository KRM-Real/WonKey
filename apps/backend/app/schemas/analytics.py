from datetime import datetime
from pydantic import BaseModel


class AnalyticsOverviewOut(BaseModel):
    total_requests: int
    total_errors: int
    error_rate: float
    avg_latency_ms: int
    p95_latency_ms: int
    window_start: datetime
    window_end: datetime


class AnalyticsPointOut(BaseModel):
    ts: datetime
    requests: int
    errors: int
    error_rate: float
    avg_latency_ms: int
    p95_latency_ms: int


class AnalyticsTimeseriesOut(BaseModel):
    bucket: str
    window_start: datetime
    window_end: datetime
    points: list[AnalyticsPointOut]
