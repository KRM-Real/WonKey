import { proxyToBackend } from "@/lib/backend-proxy";
import { requireAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ keyId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const { keyId } = await params;
  return proxyToBackend(`/v1/keys/${keyId}/revoke`, {
    method: "POST",
    headers: { "X-User-Id": auth.userId },
  });
}
