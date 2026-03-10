import { proxyToBackend } from "@/lib/backend-proxy";
import { adminProxyWrite } from "@/lib/admin-proxy-route";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ keyId: string }> };

export async function POST(request: Request, { params }: Params) {
  return adminProxyWrite(request, { params }, { requireAdminUser, proxyToBackend }, {
    method: "POST",
    buildPath: ({ params: resolvedParams }) => `/v1/keys/${resolvedParams.keyId}/revoke`,
  });
}
