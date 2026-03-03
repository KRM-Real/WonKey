import { proxyToBackend } from "@/lib/backend-proxy";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const { projectId } = await params;
  const search = new URL(request.url).search;
  return proxyToBackend(`/v1/projects/${projectId}/logs${search}`, {
    method: "GET",
    headers: { "X-User-Id": auth.userId },
  });
}
