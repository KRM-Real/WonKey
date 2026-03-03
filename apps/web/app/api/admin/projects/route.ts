import { proxyToBackend } from "@/lib/backend-proxy";
import { requireAdminUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  return proxyToBackend("/v1/projects", {
    method: "GET",
    headers: { "X-User-Id": auth.userId },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const body = await request.text();
  return proxyToBackend("/v1/projects", {
    method: "POST",
    body,
    headers: { "X-User-Id": auth.userId },
  });
}
