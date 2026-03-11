"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-browser";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("user@example.com");

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
    <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur xl:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <Link href={authed ? "/projects" : "/login"} className="flex items-center gap-3">
            <span className="text-[2rem] font-semibold tracking-[-0.06em] text-slate-900">wonkey</span>
            <span className="relative h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600">
              <span className="absolute left-[7px] top-[7px] h-2.5 w-2.5 rounded-full bg-white/90" />
              <span className="absolute right-[-2px] top-[13px] h-2.5 w-4 rounded-r-full rounded-tl-full bg-teal-700/70" />
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900",
                    active && "text-slate-900",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600 opacity-0 transition",
                      active && "opacity-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {authed ? (
            <>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 text-sm font-semibold text-slate-700">
                  {email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{email}</p>
                  <p className="text-xs text-slate-500">Logged in</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={async () => {
                  if (supabase) {
                    await supabase.auth.signOut();
                  }
                  router.push("/login");
                  router.refresh();
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/signup" className={buttonVariants({ variant: "default" })}>
              Create account
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
