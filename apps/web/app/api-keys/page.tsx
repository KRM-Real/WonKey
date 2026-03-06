import Link from "next/link";
import { TopNav } from "@/components/top-nav";

export default function ApiKeysPage() {
  return (
    <main>
      <section className="app-shell">
        <TopNav />
        <div className="dashboard-main stack">
          <div>
            <h1 style={{ marginTop: 0, fontSize: 42 }}>API Keys</h1>
            <p className="muted" style={{ marginBottom: 0 }}>
              Select a project to create, rotate, and revoke keys.
            </p>
          </div>

          <article className="card soft-shadow" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Open a project key dashboard</h3>
            <p className="muted">
              API keys are managed at the project level so each environment can have isolated credentials.
            </p>
            <Link href="/projects" className="button button-primary">
              Go to projects
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
