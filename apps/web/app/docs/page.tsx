import { TopNav } from "@/components/top-nav";

export default function DocsPage() {
  return (
    <main>
      <section className="app-shell">
        <TopNav />
        <div className="dashboard-main">
          <h1 style={{ marginTop: 0, fontSize: 42 }}>Docs</h1>
          <p className="muted">
            API documentation placeholder. Link your public docs site here or render internal docs pages.
          </p>
          <div className="empty-state">
            <h3 style={{ marginTop: 0 }}>Documentation hub</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Add quick links for authentication, SDKs, error codes, and integration guides.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
