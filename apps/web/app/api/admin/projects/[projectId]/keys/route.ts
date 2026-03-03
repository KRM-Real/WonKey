import { proxyToBackend } from "@/lib/backend-proxy";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;
  return proxyToBackend(`/v1/projects/${projectId}/keys`, {
    method: "GET",
    headers: { "X-User-Id": auth.userId },
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;
  return proxyToBackend(`/v1/projects/${projectId}/keys`, {
    method: "POST",
    headers: { "X-User-Id": auth.userId },
  });
}
