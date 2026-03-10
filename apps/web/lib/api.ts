import {
  AnalyticsOverview,
  AnalyticsTimeseries,
  ApiKey,
  ApiKeyCreateResult,
  Project,
  RequestLog,
  UsageLimitConfig,
} from "@/lib/types";
import {
  fetchWithRetry,
  handleUnauthorizedRedirect,
  HttpMethod,
  readErrorDetail,
  withQuery,
} from "@/lib/api-core";
import { supabase } from "@/lib/supabase-browser";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
};

export async function buildRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers = await buildRequestHeaders();

  const res = await fetchWithRetry(path, {
    method,
    headers,
    body: options.body,
  });

  if (!res.ok) {
    handleUnauthorizedRedirect(res);
    throw new Error(await readErrorDetail(res));
  }

  return (await res.json()) as T;
}

type LogsFilters = {
  status?: number;
  path?: string;
  from?: string;
  to?: string;
  limit?: number;
};

type UsageLimitsWire = {
  requests_per_minute: number;
  window_seconds: number;
  burst: number;
};

export function listProjects(): Promise<Project[]> {
  return request<Project[]>("/api/admin/projects");
}

export function createProject(name: string): Promise<Project> {
  return request<Project>("/api/admin/projects", { method: "POST", body: { name } });
}

export function listProjectKeys(projectId: string): Promise<ApiKey[]> {
  return request<ApiKey[]>(`/api/admin/projects/${projectId}/keys`);
}

export function createProjectKey(projectId: string): Promise<ApiKeyCreateResult> {
  return request<ApiKeyCreateResult>(`/api/admin/projects/${projectId}/keys`, { method: "POST" });
}

export function revokeKey(keyId: string): Promise<ApiKey> {
  return request<ApiKey>(`/api/admin/keys/${keyId}/revoke`, { method: "POST" });
}

export function listProjectLogs(projectId: string, filters: LogsFilters = {}): Promise<RequestLog[]> {
  return request<RequestLog[]>(
    withQuery(`/api/admin/projects/${projectId}/logs`, {
      status: filters.status,
      path: filters.path,
      from: filters.from,
      to: filters.to,
      limit: filters.limit,
    }),
  );
}

export function getAnalyticsOverview(
  projectId: string,
  from?: string,
  to?: string,
): Promise<AnalyticsOverview> {
  return request<AnalyticsOverview>(
    withQuery(`/api/admin/projects/${projectId}/analytics/overview`, { from, to }),
  );
}

export function getAnalyticsTimeseries(
  projectId: string,
  bucket: "hour" = "hour",
  from?: string,
  to?: string,
): Promise<AnalyticsTimeseries> {
  return request<AnalyticsTimeseries>(
    withQuery(`/api/admin/projects/${projectId}/analytics/timeseries`, { bucket, from, to }),
  );
}

export async function getProjectLimits(projectId: string): Promise<UsageLimitConfig> {
  const wire = await request<UsageLimitsWire>(`/api/admin/projects/${projectId}/limits`);
  return {
    requestsPerMinute: wire.requests_per_minute,
    windowSeconds: wire.window_seconds,
    burst: wire.burst,
  };
}

export async function updateProjectLimits(
  projectId: string,
  payload: UsageLimitConfig,
): Promise<UsageLimitConfig> {
  const wire = await request<UsageLimitsWire>(`/api/admin/projects/${projectId}/limits`, {
    method: "PUT",
    body: {
      requests_per_minute: payload.requestsPerMinute,
      window_seconds: payload.windowSeconds,
      burst: payload.burst,
    },
  });
  return {
    requestsPerMinute: wire.requests_per_minute,
    windowSeconds: wire.window_seconds,
    burst: wire.burst,
  };
}
