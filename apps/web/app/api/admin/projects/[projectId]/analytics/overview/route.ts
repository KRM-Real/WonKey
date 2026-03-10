import { proxyToBackend } from "@/lib/backend-proxy";
import { adminProxyGet } from "@/lib/admin-proxy-route";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  return adminProxyGet(request, { params }, { requireAdminUser, proxyToBackend }, ({ params: resolvedParams, request: routeRequest }) => {
    return `/v1/projects/${resolvedParams.projectId}/analytics/overview${new URL(routeRequest.url).search}`;
  });
}
