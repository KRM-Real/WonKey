import { proxyToBackend } from "@/lib/backend-proxy";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;
  return proxyToBackend(`/v1/projects/${projectId}/keys`, { method: "GET" });
}

export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;
  return proxyToBackend(`/v1/projects/${projectId}/keys`, { method: "POST" });
}
