import "server-only";

const API_BASE = process.env.WONKEY_API_BASE_URL ?? "http://127.0.0.1:8000";
const ADMIN_API_KEY = process.env.WONKEY_ADMIN_API_KEY;

type ProxyOptions = {
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
};

export async function proxyToBackend(path: string, options: ProxyOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (ADMIN_API_KEY) {
    headers.Authorization = `Bearer ${ADMIN_API_KEY}`;
  }

  const upstream = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "application/json";
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
    },
  });
}
