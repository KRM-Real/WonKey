import { proxyToBackend } from "@/lib/backend-proxy";
import { adminProxyGet, adminProxyWrite } from "@/lib/admin-proxy-route";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  return adminProxyGet(request, { params }, { requireAdminUser, proxyToBackend }, ({ params: resolvedParams }) => {
    return `/v1/projects/${resolvedParams.projectId}/limits`;
  });
}

export async function PUT(request: Request, { params }: Params) {
  return adminProxyWrite(request, { params }, { requireAdminUser, proxyToBackend }, {
    method: "PUT",
    includeBody: true,
    buildPath: ({ params: resolvedParams }) => `/v1/projects/${resolvedParams.projectId}/limits`,
  });
}
