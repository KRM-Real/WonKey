import { ApiKey, ApiKeyCreateResult, Project } from "@/lib/types";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

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
