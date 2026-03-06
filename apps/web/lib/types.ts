export type Project = {
  id: string;
  name: string;
  org_id: string;
  created_at: string;
};

export type ApiKey = {
  id: string;
  project_id: string;
  key_prefix: string;
  status: "active" | "revoked" | string;
  created_at: string;
  last_used_at: string | null;
};

export type ApiKeyCreateResult = ApiKey & {
  raw_key: string;
};

export type RequestLog = {
  id: string;
  project_id: string;
  key_id: string | null;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AnalyticsOverview = {
  total_requests: number;
  total_errors: number;
  error_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  window_start: string;
  window_end: string;
};

export type AnalyticsPoint = {
  ts: string;
  requests: number;
  errors: number;
  error_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
};

export type AnalyticsTimeseries = {
  bucket: "hour" | string;
  window_start: string;
  window_end: string;
  points: AnalyticsPoint[];
};

export type UsageLimitConfig = {
  requestsPerMinute: number;
  windowSeconds: number;
  burst: number;
};
