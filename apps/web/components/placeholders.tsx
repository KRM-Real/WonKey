export function LimitsPlaceholder() {
  return (
    <section className="empty-state">
      <h3 style={{ marginTop: 0 }}>Limits tab scaffolded</h3>
      <p className="muted">
        Sprint 6A keeps this UI ready. Sprint 6B can wire this to backend limits endpoints when finalized.
      </p>
      <div className="badge">Placeholder</div>
    </section>
  );
}

export function LogsPlaceholder() {
  return (
    <section className="empty-state">
      <h3 style={{ marginTop: 0 }}>Logs coming soon</h3>
      <p className="muted" style={{ marginBottom: 0 }}>
        Backend Sprint 4 will provide request log API integration for this view.
      </p>
    </section>
  );
}

export function AnalyticsPlaceholder() {
  return (
    <section className="empty-state">
      <h3 style={{ marginTop: 0 }}>Analytics charts coming soon</h3>
      <p className="muted" style={{ marginBottom: 0 }}>
        Backend Sprint 5 will power usage timeseries and error rate charts in this tab.
      </p>
    </section>
  );
}
