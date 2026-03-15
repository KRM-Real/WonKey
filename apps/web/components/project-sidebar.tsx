"use client";

import Link from "next/link";
import { BarChart3, FolderKanban, KeyRound, LayoutGrid, Logs, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "keys" | "limits" | "logs" | "analytics" | "settings";

const navItems = [
  { slug: "keys" as const, label: "API Keys", icon: KeyRound },
  { slug: "limits" as const, label: "Usage Limits", icon: LayoutGrid },
  { slug: "logs" as const, label: "Logs", icon: Logs },
  { slug: "analytics" as const, label: "Analytics", icon: BarChart3 },
  { slug: "settings" as const, label: "Settings", icon: Settings2 },
];

type Props = {
  projectId: string;
  projectName: string;
  activeTab: Tab;
};

export function ProjectSidebar({ projectId, projectName, activeTab }: Props) {
  return (
    <aside className="border-b border-slate-200 bg-white px-5 py-5 lg:min-h-[calc(100vh-120px)] lg:w-[260px] lg:border-b-0 lg:border-r xl:px-6">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Projects</span>
            <Badge variant="blue">Active</Badge>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <FolderKanban className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Projects</p>
                <p className="text-xs text-slate-500">Switch workspace</p>
              </div>
            </div>
            <span className="text-slate-400">+</span>
          </button>
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{projectName}</p>
            <p className="mt-1 text-xs text-slate-500">Production workspace</p>
          </div>
        </div>

        <nav aria-label="Project Navigation" className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.slug === activeTab;
            return (
              <Link
                key={`${item.slug}-${item.label}`}
                href={`/projects/${projectId}?tab=${item.slug}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900",
                  active && "bg-blue-50 text-blue-700",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500",
                    active && "border-blue-200 bg-blue-100 text-blue-700",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
