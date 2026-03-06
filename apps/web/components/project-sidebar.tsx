"use client";

import Link from "next/link";
import { ReactNode } from "react";
import {
  AnalyticsIcon,
  GaugeIcon,
  KeyIcon,
  LogsIcon,
  SettingsIcon,
} from "@/components/icons";

type Tab = "keys" | "limits" | "logs" | "analytics";

const navItems: Array<{ slug: Tab; label: string; icon: ReactNode }> = [
  { slug: "keys", label: "API Keys", icon: <KeyIcon /> },
  { slug: "limits", label: "Usage Limits", icon: <GaugeIcon /> },
  { slug: "logs", label: "Logs", icon: <LogsIcon /> },
  { slug: "analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { slug: "keys", label: "Settings", icon: <SettingsIcon /> },
];

type Props = {
  projectId: string;
  projectName: string;
  activeTab: Tab;
};

export function ProjectSidebar({ projectId, projectName, activeTab }: Props) {
  return (
    <aside className="project-sidebar">
      <button type="button" className="sidebar-project-select">
        Projects
      </button>
      <div className="sidebar-project-current">
        <strong>{projectName}</strong>
      </div>
      <nav className="sidebar-nav" aria-label="Project Navigation">
        {navItems.map((item, index) => {
          const href = `/projects/${projectId}?tab=${item.slug}`;
          const active = item.slug === activeTab && index < 4;
          return (
            <Link key={`${item.slug}-${item.label}`} href={href} className={`sidebar-link ${active ? "is-active" : ""}`}>
              <span className="badge" style={{ minWidth: 24, justifyContent: "center", padding: "2px 8px" }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
