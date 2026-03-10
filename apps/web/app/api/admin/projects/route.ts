import { proxyToBackend } from "@/lib/backend-proxy";
import { adminProxyGet, adminProxyWrite } from "@/lib/admin-proxy-route";
import { requireAdminUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  return adminProxyGet(request, { params: Promise.resolve({}) }, { requireAdminUser, proxyToBackend }, () => "/v1/projects");
}

export async function POST(request: Request) {
  return adminProxyWrite(request, { params: Promise.resolve({}) }, { requireAdminUser, proxyToBackend }, {
    method: "POST",
    includeBody: true,
    buildPath: () => "/v1/projects",
  });
}
