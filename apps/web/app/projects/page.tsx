import { TopNav } from "@/components/top-nav";
import { ProjectsClient } from "./projects-client";

export default function ProjectsPage() {
  return (
    <>
      <TopNav />
      <main className="stack">
        <section>
          <h1 style={{ marginBottom: 8 }}>Projects</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Create projects and issue API keys from this dashboard.
          </p>
        </section>
        <ProjectsClient />
      </main>
    </>
  );
}
