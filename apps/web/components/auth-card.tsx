"use client";

import { FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Mode = "login" | "signup";

export function AuthCard() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const missingSupabase = useMemo(() => !supabase, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!supabase) {
      setMessage("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Login successful.");
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage("Signup successful. Check your email for confirmation if required.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ maxWidth: 520, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          className={`button ${mode === "login" ? "button-primary" : "button-soft"}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={`button ${mode === "signup" ? "button-primary" : "button-soft"}`}
          onClick={() => setMode("signup")}
        >
          Signup
        </button>
      </div>

      <form onSubmit={submit} className="stack">
        <label>
          Email
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button className="button button-primary" type="submit" disabled={busy || missingSupabase}>
          {busy ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      {message ? (
        <p style={{ marginBottom: 0, marginTop: 14 }} className="muted">
          {message}
        </p>
      ) : null}
    </section>
  );
}
