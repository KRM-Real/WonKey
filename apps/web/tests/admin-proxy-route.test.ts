import assert from "node:assert/strict";

import { adminProxyGet, adminProxyWrite } from "../lib/admin-proxy-route.ts";

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

async function run() {
  await testAuthFailureShortCircuits();
  await testGetForwarding();
  await testWriteForwardingWithBody();
  await testWriteForwardingWithoutBody();
  console.log("admin-proxy-route tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
