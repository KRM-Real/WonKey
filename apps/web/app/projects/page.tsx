import { TopNav } from "@/components/top-nav";
import { ProjectsClient } from "@/components/projects-client";
import { SessionGate } from "@/components/session-gate";

export default function ProjectsPage() {
  return (
    <main>
      <section className="app-shell">
        <TopNav />
        <div className="dashboard-main">
          <section style={{ marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 44 }}>Projects</h1>
            <p className="muted" style={{ marginTop: 6, marginBottom: 0 }}>
              Build and manage API products with polished key management and usage tracking.
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
