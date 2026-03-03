"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const missingSupabase = useMemo(() => !supabase, []);

  useEffect(() => {
    if (missingSupabase) {
      setMessage("Frontend auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local.");
    }
  }, [missingSupabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();

    if (!supabase) {
      setMessage("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!normalizedEmail) {
      setMessage("Email is required.");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });
      if (error) throw error;

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMessage("Signup successful. Verify your email, then login.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel auth-shell">
      {DEV_BYPASS_AUTH ? (
        <div className="badge" style={{ marginBottom: 10 }}>
          Dev auth bypass is enabled
        </div>
      ) : null}
      <h1 style={{ marginTop: 0 }}>{mode === "login" ? "Log in" : "Create account"}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {mode === "login"
          ? "Access your WonKey dashboard."
          : "Start managing API keys and usage analytics."}
      </p>

      <form onSubmit={onSubmit} className="stack">
        <label>
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>

        {mode === "signup" ? (
          <label>
            Confirm password
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        ) : null}

        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="muted" style={{ marginBottom: 0 }}>
        {mode === "login" ? "No account yet? " : "Already have an account? "}
        <Link href={mode === "login" ? "/signup" : "/login"} className="auth-link">
          {mode === "login" ? "Sign up" : "Log in"}
        </Link>
      </p>

      {message ? (
        <div className="panel" style={{ padding: 12, marginTop: 12 }}>
          {message}
        </div>
      ) : null}
    </section>
  );
}
