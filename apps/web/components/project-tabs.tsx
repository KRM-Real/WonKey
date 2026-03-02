"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const tabs = [
  { slug: "keys", label: "Keys" },
  { slug: "limits", label: "Limits" },
  { slug: "logs", label: "Logs" },
  { slug: "analytics", label: "Analytics" },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "keys";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
      {tabs.map((tab) => {
        const href = `/projects/${projectId}?tab=${tab.slug}`;
        const active = activeTab === tab.slug;
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`button ${active ? "button-primary" : "button-soft"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
