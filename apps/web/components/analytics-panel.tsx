"use client";

import { useMemo, useState } from "react";
import { AnalyticsOverview, AnalyticsTimeseries } from "@/lib/types";

export type AnalyticsFilters = {
  from: string;
  to: string;
};

type Props = {
  overview: AnalyticsOverview | null;
  timeseries: AnalyticsTimeseries | null;
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  onChangeFilters: (next: AnalyticsFilters) => void;
  onRefresh: () => Promise<void>;
};

export function AnalyticsPanel({
  overview,
  timeseries,
  loading,
  error,
  filters,
  onChangeFilters,
  onRefresh,
}: Props) {
  const [busyRefresh, setBusyRefresh] = useState(false);
  const maxRequests = useMemo(
    () => Math.max(1, ...(timeseries?.points.map((p) => p.requests) ?? [1])),
    [timeseries],
  );

  return (
    <section className="stack">
      <div className="panel" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Usage Analytics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          <input
            className="input"
            type="datetime-local"
            value={filters.from}
            onChange={(e) => onChangeFilters({ ...filters, from: e.target.value })}
          />
          <input
            className="input"
            type="datetime-local"
            value={filters.to}
            onChange={(e) => onChangeFilters({ ...filters, to: e.target.value })}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            className="button button-primary"
            disabled={loading || busyRefresh}
            onClick={async () => {
              setBusyRefresh(true);
              try {
                await onRefresh();
              } finally {
                setBusyRefresh(false);
              }
            }}
          >
            {busyRefresh ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="panel" style={{ padding: 16, borderColor: "#fecdd3", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}
      >
        <div className="panel" style={{ padding: 14 }}>
          <div className="muted">Requests</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{overview?.total_requests ?? 0}</div>
        </div>
        <div className="panel" style={{ padding: 14 }}>
          <div className="muted">Error rate</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{overview?.error_rate ?? 0}%</div>
        </div>
        <div className="panel" style={{ padding: 14 }}>
          <div className="muted">Avg latency</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{overview?.avg_latency_ms ?? 0} ms</div>
        </div>
        <div className="panel" style={{ padding: 14 }}>
          <div className="muted">P95 latency</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{overview?.p95_latency_ms ?? 0} ms</div>
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <h4 style={{ marginTop: 0 }}>Requests per hour</h4>
        {!timeseries || timeseries.points.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            No timeseries points for this window.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {timeseries.points.map((point) => {
              const pct = Math.round((point.requests / maxRequests) * 100);
              return (
                <div key={point.ts} style={{ display: "grid", gridTemplateColumns: "180px 1fr 64px", gap: 8 }}>
                  <div className="muted">{new Date(point.ts).toLocaleString()}</div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 99,
                      background: "var(--surface-2)",
                      overflow: "hidden",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--brand)",
                      }}
                    />
                  </div>
                  <div style={{ textAlign: "right" }}>{point.requests}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
