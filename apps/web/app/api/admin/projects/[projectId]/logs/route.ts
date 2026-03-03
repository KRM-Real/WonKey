import { proxyToBackend } from "@/lib/backend-proxy";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { projectId } = await params;
  const search = new URL(request.url).search;
  return proxyToBackend(`/v1/projects/${projectId}/logs${search}`, { method: "GET" });
}
