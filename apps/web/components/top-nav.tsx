"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type NavItem = {
  href: string;
  label: string;
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!supabase) {
        if (mounted) setAuthed(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) setAuthed(Boolean(session));
    }

    void run();
    const { data } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => setAuthed(Boolean(session)))
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const navItems: NavItem[] = authed
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/projects", label: "Projects" },
      ]
    : [
        { href: "/login", label: "Login" },
        { href: "/signup", label: "Signup" },
      ];

  return (
    <header style={{ padding: "16px 24px 0" }}>
      <div className="panel" style={{ padding: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>WONKEY</div>
        <div style={{ display: "flex", gap: 8 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`button ${active ? "button-primary" : "button-soft"}`}
              >
                {item.label}
              </Link>
            );
          })}
          {authed ? (
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
