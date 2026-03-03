import {
  AnalyticsOverview,
  AnalyticsTimeseries,
  ApiKey,
  ApiKeyCreateResult,
  Project,
  RequestLog,
} from "@/lib/types";
import { supabase } from "@/lib/supabase-browser";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const fallback = `Request failed: ${res.status}`;
    let detail = fallback;
    try {
      const payload = (await res.json()) as { detail?: string };
      detail = payload.detail ?? fallback;
    } catch {
      detail = fallback;
    }
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

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

type LogsFilters = {
  status?: number;
  path?: string;
  from?: string;
  to?: string;
  limit?: number;
};

function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
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
