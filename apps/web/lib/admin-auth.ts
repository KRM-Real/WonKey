import "server-only";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === "true";
const DEV_BYPASS_USER_ID = process.env.DEV_BYPASS_USER_ID ?? "dev-local-user";

function unauthorized(detail: string): Response {
  return new Response(JSON.stringify({ detail }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

export async function requireAdminUser(request: Request): Promise<{ userId: string } | Response> {
  if (process.env.NODE_ENV !== "production" && DEV_BYPASS_AUTH) {
    return { userId: DEV_BYPASS_USER_ID };
  }

  try {
    const auth = request.headers.get("Authorization");
    const token = auth?.toLowerCase().startsWith("bearer ")
      ? auth.split(" ", 2)[1]
      : undefined;
    if (!token) {
      return unauthorized("Missing session token");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ detail: "Supabase auth is not configured" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return unauthorized("Invalid session token");
    }

    return { userId: data.user.id };
  } catch (error) {
    return new Response(
      JSON.stringify({
        detail: error instanceof Error ? `Admin auth failed: ${error.message}` : "Admin auth failed",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
