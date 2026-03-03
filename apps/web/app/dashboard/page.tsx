import { TopNav } from "@/components/top-nav";
import { SessionGate } from "@/components/session-gate";
import { ProjectsClient } from "@/components/projects-client";

export default function DashboardPage() {
  return (
    <>
      <TopNav />
      <main className="stack">
        <section className="panel" style={{ padding: 18 }}>
          <h1 style={{ marginTop: 0 }}>Dashboard</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Manage projects, issue API keys, and monitor usage in one place.
          </p>
        </section>
        <SessionGate>
          <ProjectsClient />
        </SessionGate>
      </main>
    </>
  );
}
