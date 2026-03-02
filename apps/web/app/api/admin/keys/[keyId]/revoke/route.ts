import { proxyToBackend } from "@/lib/backend-proxy";

type Params = { params: Promise<{ keyId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { keyId } = await params;
  return proxyToBackend(`/v1/keys/${keyId}/revoke`, { method: "POST" });
}
