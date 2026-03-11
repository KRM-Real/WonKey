"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "keys", label: "API Keys" },
  { slug: "limits", label: "Usage Limits" },
  { slug: "logs", label: "Logs" },
  { slug: "analytics", label: "Analytics" },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "keys";

  return (
    <div className="mb-8 flex gap-5 overflow-x-auto border-b border-slate-200">
      {tabs.map((tab) => {
        const active = activeTab === tab.slug;
        return (
          <Link
            key={tab.slug}
            href={`/projects/${projectId}?tab=${tab.slug}`}
            className={cn(
              "relative shrink-0 px-1 pb-3 text-sm font-medium text-slate-500 transition hover:text-slate-900",
              active && "text-slate-900",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-blue-600 opacity-0 transition",
                active && "opacity-100",
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
