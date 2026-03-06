"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
    <div className="sub-tabs">
      {tabs.map((tab) => {
        const href = `/projects/${projectId}?tab=${tab.slug}`;
        const active = activeTab === tab.slug;
        return (
          <Link key={tab.slug} href={href} className={`sub-tab ${active ? "is-active" : ""}`}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
