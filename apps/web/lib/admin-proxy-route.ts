type AuthResult = { userId: string } | Response;

type RouteDeps = {
  requireAdminUser: (request: Request) => Promise<AuthResult>;
  proxyToBackend: (
    path: string,
    options?: {
      method?: "GET" | "POST" | "PUT";
      body?: string;
      headers?: Record<string, string>;
    },
  ) => Promise<Response>;
};

type ParamMap = Record<string, string>;

type RouteParams<T extends ParamMap> = {
  params: Promise<T>;
};

export async function adminProxyGet<T extends ParamMap>(
  request: Request,
  routeContext: RouteParams<T>,
  deps: RouteDeps,
  buildPath: (args: { params: T; request: Request }) => string,
): Promise<Response> {
  const auth = await deps.requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const params = await routeContext.params;
  return deps.proxyToBackend(buildPath({ params, request }), {
    method: "GET",
    headers: { "X-User-Id": auth.userId },
  });
}

export async function adminProxyWrite<T extends ParamMap>(
  request: Request,
  routeContext: RouteParams<T>,
  deps: RouteDeps,
  options: {
    method: "POST" | "PUT";
    buildPath: (args: { params: T; request: Request }) => string;
    includeBody?: boolean;
  },
): Promise<Response> {
  const auth = await deps.requireAdminUser(request);
  if (auth instanceof Response) return auth;

  const params = await routeContext.params;
  return deps.proxyToBackend(options.buildPath({ params, request }), {
    method: options.method,
    body: options.includeBody ? await request.text() : undefined,
    headers: { "X-User-Id": auth.userId },
  });
}
