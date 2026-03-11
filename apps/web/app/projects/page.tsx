import { TopNav } from "@/components/top-nav";
import { ProjectsClient } from "@/components/projects-client";
import { SessionGate } from "@/components/session-gate";

export default function ProjectsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 md:px-6 xl:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <TopNav />
        <div className="px-5 py-8 xl:px-8">
          <section className="mb-8">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-900 md:text-5xl">Projects</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
              Build and manage API products with polished key management, analytics, and usage controls.
            </p>
          </section>
          <SessionGate>
            <ProjectsClient />
          </SessionGate>
        </div>
      </section>
    </main>
  );
}
