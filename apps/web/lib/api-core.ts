export type HttpMethod = "GET" | "POST" | "PUT";

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function toRequestBody(body: unknown): string | undefined {
  return body ? JSON.stringify(body) : undefined;
}

export async function performRequest(
  path: string,
  options: {
    method: HttpMethod;
    headers: Record<string, string>;
    body?: unknown;
  },
): Promise<Response> {
  return fetch(path, {
    method: options.method,
    headers: options.headers,
    body: toRequestBody(options.body),
    cache: "no-store",
  });
}

export async function fetchWithRetry(
  path: string,
  options: {
    method: HttpMethod;
    headers: Record<string, string>;
    body?: unknown;
  },
): Promise<Response> {
  try {
    const res = await performRequest(path, options);
    if (
      options.method === "GET" &&
      (res.status === 500 || res.status === 502 || res.status === 503)
    ) {
      await sleep(250);
      return performRequest(path, options);
    }
    return res;
  } catch (error) {
    if (options.method !== "GET") {
      throw error;
    }
    await sleep(250);
    return performRequest(path, options);
  }
}

export async function readErrorDetail(res: Response): Promise<string> {
  const fallback = `Request failed: ${res.status}`;
  try {
    const payload = (await res.json()) as { detail?: string };
    return payload.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export function handleUnauthorizedRedirect(res: Response): void {
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
