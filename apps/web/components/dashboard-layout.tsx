import { ReactNode } from "react";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ProjectTabs } from "@/components/project-tabs";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";

type Props = {
  projectId: string;
  projectName: string;
  activeTab: "keys" | "limits" | "logs" | "analytics";
  usingMock: boolean;
  children: ReactNode;
};

export function DashboardLayout({ projectId, projectName, activeTab, usingMock, children }: Props) {
  return (
    <section className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 md:px-6 xl:px-8">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <TopNav />
        <div className="lg:flex">
          <ProjectSidebar projectId={projectId} projectName={projectName} activeTab={activeTab} />
          <div className="min-w-0 flex-1 bg-white">
            <div className="border-b border-slate-200 px-5 py-8 xl:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900 md:text-5xl">
                      {projectName}
                    </h1>
                    {usingMock ? <Badge variant="yellow">Demo data fallback</Badge> : null}
                  </div>
                  <p className="max-w-2xl text-sm text-slate-500 md:text-base">
                    Manage keys, observe traffic, and tune limits from a single production-style dashboard.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Workspace: <span className="font-medium text-slate-900">Production</span>
                </div>
              </div>
              <div className="mt-8">
                <ProjectTabs projectId={projectId} />
              </div>
            </div>
            <div className="px-5 py-6 xl:px-8 xl:py-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
