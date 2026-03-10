import assert from "node:assert/strict";

import { adminProxyGet, adminProxyWrite } from "../lib/admin-proxy-route.ts";
import {
  fetchWithRetry,
  handleUnauthorizedRedirect,
  readErrorDetail,
  withQuery,
} from "../lib/api-core.ts";

async function testAuthFailureShortCircuits() {
  let proxied = false;
  const response = new Response(JSON.stringify({ detail: "Missing session token" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });

  const result = await adminProxyGet(
    new Request("http://localhost/api/admin/projects"),
    { params: Promise.resolve({}) },
    {
      requireAdminUser: async () => response,
      proxyToBackend: async () => {
        proxied = true;
        return new Response();
      },
    },
    () => "/v1/projects",
  );

  assert.equal(proxied, false);
  assert.equal(result.status, 401);
  assert.equal(await result.text(), JSON.stringify({ detail: "Missing session token" }));
}

async function testGetForwarding() {
  let path = "";
  let options:
    | {
        method?: "GET" | "POST" | "PUT";
        body?: string;
        headers?: Record<string, string>;
      }
    | undefined;

  const result = await adminProxyGet(
    new Request("http://localhost/api/admin/projects/project-1/logs?status=500&limit=25"),
    { params: Promise.resolve({ projectId: "project-1" }) },
    {
      requireAdminUser: async () => ({ userId: "user-123" }),
      proxyToBackend: async (nextPath, nextOptions) => {
        path = nextPath;
        options = nextOptions;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    },
    ({ params, request }) => `/v1/projects/${params.projectId}/logs${new URL(request.url).search}`,
  );

  assert.equal(result.status, 200);
  assert.equal(path, "/v1/projects/project-1/logs?status=500&limit=25");
  assert.deepEqual(options, {
    method: "GET",
    headers: { "X-User-Id": "user-123" },
  });
}

async function testWriteForwardingWithBody() {
  let path = "";
  let options:
    | {
        method?: "GET" | "POST" | "PUT";
        body?: string;
        headers?: Record<string, string>;
      }
    | undefined;

  const result = await adminProxyWrite(
    new Request("http://localhost/api/admin/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Demo Project" }),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({}) },
    {
      requireAdminUser: async () => ({ userId: "user-123" }),
      proxyToBackend: async (nextPath, nextOptions) => {
        path = nextPath;
        options = nextOptions;
        return new Response(JSON.stringify({ id: "project-1" }), { status: 200 });
      },
    },
    {
      method: "POST",
      includeBody: true,
      buildPath: () => "/v1/projects",
    },
  );

  assert.equal(result.status, 200);
  assert.equal(path, "/v1/projects");
  assert.deepEqual(options, {
    method: "POST",
    body: JSON.stringify({ name: "Demo Project" }),
    headers: { "X-User-Id": "user-123" },
  });
}

async function testWriteForwardingWithoutBody() {
  let options:
    | {
        method?: "GET" | "POST" | "PUT";
        body?: string;
        headers?: Record<string, string>;
      }
    | undefined;

  await adminProxyWrite(
    new Request("http://localhost/api/admin/keys/key-1/revoke", { method: "POST" }),
    { params: Promise.resolve({ keyId: "key-1" }) },
    {
      requireAdminUser: async () => ({ userId: "user-123" }),
      proxyToBackend: async (_nextPath, nextOptions) => {
        options = nextOptions;
        return new Response(null, { status: 204 });
      },
    },
    {
      method: "POST",
      buildPath: ({ params }) => `/v1/keys/${params.keyId}/revoke`,
    },
  );

  assert.deepEqual(options, {
    method: "POST",
    body: undefined,
    headers: { "X-User-Id": "user-123" },
  });
}

async function testWithQueryOmitsEmptyValues() {
  assert.equal(
    withQuery("/api/admin/projects/demo/logs", {
      status: 500,
      path: "",
      from: "2026-03-10T00:00:00.000Z",
      to: undefined,
      limit: 25,
    }),
    "/api/admin/projects/demo/logs?status=500&from=2026-03-10T00%3A00%3A00.000Z&limit=25",
  );
}

async function testFetchWithRetryRetriesGetOnTransientStatus() {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ path: string; method: string }> = [];
  let attempt = 0;

  globalThis.fetch = (async (input, init) => {
    calls.push({ path: String(input), method: String(init?.method) });
    attempt += 1;
    if (attempt === 1) {
      return new Response(JSON.stringify({ detail: "Temporary upstream issue" }), { status: 503 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  try {
    const response = await fetchWithRetry("/api/admin/projects", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls, [
      { path: "/api/admin/projects", method: "GET" },
      { path: "/api/admin/projects", method: "GET" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testFetchWithRetryDoesNotRetryNonGetFailures() {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = (async () => {
    calls += 1;
    throw new Error("network down");
  }) as typeof fetch;

  try {
    await assert.rejects(
      fetchWithRetry("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { name: "Demo" },
      }),
      /network down/,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testReadErrorDetailFallsBackWhenJsonIsMissing() {
  const detail = await readErrorDetail(new Response("gateway exploded", { status: 502 }));
  assert.equal(detail, "Request failed: 502");
}

async function testHandleUnauthorizedRedirectRoutesToLogin() {
  const originalWindow = globalThis.window;
  const location = { href: "/projects" };
  Object.defineProperty(globalThis, "window", {
    value: { location },
    configurable: true,
  });

  try {
    handleUnauthorizedRedirect(new Response(null, { status: 401 }));
    assert.equal(location.href, "/login");
  } finally {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
    });
  }
}

async function run() {
  await testAuthFailureShortCircuits();
  await testGetForwarding();
  await testWriteForwardingWithBody();
  await testWriteForwardingWithoutBody();
  await testWithQueryOmitsEmptyValues();
  await testFetchWithRetryRetriesGetOnTransientStatus();
  await testFetchWithRetryDoesNotRetryNonGetFailures();
  await testReadErrorDetailFallsBackWhenJsonIsMissing();
  await testHandleUnauthorizedRedirectRoutesToLogin();
  console.log("admin-proxy-route tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
