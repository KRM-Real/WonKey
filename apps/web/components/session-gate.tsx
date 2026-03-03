"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type Props = {
  children: React.ReactNode;
};

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export function SessionGate({ children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setReady(true);
      return;
    }

    let mounted = true;

    async function run() {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return <div className="panel" style={{ padding: 16 }}>Loading session...</div>;
  }

  return <>{children}</>;
}
