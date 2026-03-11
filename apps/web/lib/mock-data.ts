import { AnalyticsOverview, AnalyticsTimeseries, ApiKey, Project, RequestLog } from "@/lib/types";

const now = Date.parse("2026-03-10T12:00:00.000Z");

export const mockProjects: Project[] = [
  {
    id: "proj_payments",
    org_id: "org_2f8f8e1a-3d2f-4574-a10d-f193127f67e4",
    name: "Payments API",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 48).toISOString(),
  },
  {
    id: "proj_orders",
    org_id: "org_2f8f8e1a-3d2f-4574-a10d-f193127f67e4",
    name: "Orders API",
    created_at: new Date(now - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
];

export const mockKeysByProject: Record<string, ApiKey[]> = {
  proj_payments: [
    {
      id: "key_1",
      project_id: "proj_payments",
      key_prefix: "wk_live_91Af",
      status: "active",
      created_at: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
      last_used_at: new Date(now - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "key_2",
      project_id: "proj_payments",
      key_prefix: "wk_live_Ua72",
      status: "active",
      created_at: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
      last_used_at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "key_3",
      project_id: "proj_payments",
      key_prefix: "wk_test_Mx20",
      status: "revoked",
      created_at: new Date(now - 1000 * 60 * 60 * 240).toISOString(),
      last_used_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    },
  ],
};

export const mockLogsByProject: Record<string, RequestLog[]> = {
  proj_payments: [
    {
      id: "log_1",
      project_id: "proj_payments",
      key_id: "key_1",
      method: "GET",
      path: "/v1/products",
      status_code: 200,
      latency_ms: 185,
      ip: "34.201.20.11",
      user_agent: "node-fetch",
      created_at: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "log_2",
      project_id: "proj_payments",
      key_id: "key_1",
      method: "POST",
      path: "/v1/orders",
      status_code: 200,
      latency_ms: 125,
      ip: "34.201.20.15",
      user_agent: "axios",
      created_at: new Date(now - 1000 * 60 * 23).toISOString(),
    },
    {
      id: "log_3",
      project_id: "proj_payments",
      key_id: "key_2",
      method: "PATCH",
      path: "/v1/users",
      status_code: 404,
      latency_ms: 197,
      ip: "44.32.20.10",
      user_agent: "curl",
      created_at: new Date(now - 1000 * 60 * 37).toISOString(),
    },
    {
      id: "log_4",
      project_id: "proj_payments",
      key_id: "key_2",
      method: "DELETE",
      path: "/v1/payments/1",
      status_code: 500,
      latency_ms: 322,
      ip: "44.32.20.15",
      user_agent: "curl",
      created_at: new Date(now - 1000 * 60 * 49).toISOString(),
    },
  ],
};

export const mockOverviewByProject: Record<string, AnalyticsOverview> = {
  proj_payments: {
    total_requests: 2148,
    total_errors: 23,
    error_rate: 1.06,
    avg_latency_ms: 139,
    p95_latency_ms: 287,
    window_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    window_end: new Date(now).toISOString(),
  },
};

export const mockTimeseriesByProject: Record<string, AnalyticsTimeseries> = {
  proj_payments: {
    bucket: "hour",
    window_start: new Date(now - 1000 * 60 * 60 * 24 * 7).toISOString(),
    window_end: new Date(now).toISOString(),
    points: [
      70, 92, 80, 78, 95, 135, 122, 144, 173, 150, 198, 220, 260, 248,
    ].map((requests, i) => ({
      ts: new Date(now - 1000 * 60 * 24 * 60 * (13 - i)).toISOString(),
      requests,
      errors: i % 5 === 0 ? 4 : 2,
      error_rate: i % 5 === 0 ? 2.3 : 1.1,
      avg_latency_ms: 130 + i * 2,
      p95_latency_ms: 250 + i * 3,
    })),
  },
};

export const mockTopEndpoints = [
  { label: "GET /products", value: 56.8, color: "#4ea8a2" },
  { label: "POST /orders", value: 21.7, color: "#99d0ca" },
  { label: "GET /users", value: 14.2, color: "#9ca7d9" },
  { label: "GET /payments", value: 4.6, color: "#e3aa76" },
  { label: "Other", value: 2.7, color: "#d49ba8" },
];
