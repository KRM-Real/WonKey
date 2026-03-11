"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle className="text-3xl tracking-[-0.04em]">
          {mode === "login" ? "Welcome back" : "Create your WonKey account"}
        </CardTitle>
        <CardDescription>
          {mode === "login" ? "Access your WonKey dashboard." : "Start managing API keys and usage analytics."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>

          {mode === "signup" ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Confirm password
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          ) : null}

          <Button className="w-full" type="submit" disabled={busy}>
            {busy ? "Working..." : mode === "login" ? "Log in" : "Sign up"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-sm text-slate-500">
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-blue-600 hover:text-blue-700">
            {mode === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>

        {message ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      </CardContent>
    </Card>
  );
}
