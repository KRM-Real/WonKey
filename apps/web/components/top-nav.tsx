"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BellIcon, ChevronDownIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase-browser";

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("user@example.com");

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setAuthed(true);
      setEmail("user@example.com");
      return;
    }

    let mounted = true;

    async function run() {
      if (!supabase) {
        if (mounted) setAuthed(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setAuthed(Boolean(session));
        setEmail(session?.user?.email ?? "user@example.com");
      }
    }

    void run();
    const { data } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setAuthed(Boolean(session));
          setEmail(session?.user?.email ?? "user@example.com");
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const navItems = authed
    ? [
        { href: "/projects", label: "Projects" },
        { href: "/docs", label: "Docs" },
        { href: "/api-keys", label: "API Keys" },
      ]
    : [{ href: "/login", label: "Login" }];

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <Link className="wordmark" href={authed ? "/projects" : "/login"}>
          <span style={{ textTransform: "lowercase", letterSpacing: "-0.03em" }}>wonkey</span>
          <span className="wordmark-mark" />
        </Link>
        <nav className="primary-nav">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`primary-nav-link ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="top-nav-right">
        {authed ? (
          <>
            <span className="muted" aria-hidden>
              <BellIcon />
            </span>
            <span className="muted">Logged in as {email}</span>
            <span className="avatar">{email.slice(0, 1).toUpperCase()}</span>
            <span className="muted" aria-hidden>
              <ChevronDownIcon />
            </span>
            <button
              type="button"
              className="button button-soft"
              onClick={async () => {
                if (supabase) {
                  await supabase.auth.signOut();
                }
                router.push("/login");
                router.refresh();
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/signup" className="button button-primary">
            Create account
          </Link>
        )}
      </div>
    </div>
  );
}
