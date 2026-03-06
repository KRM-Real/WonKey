"use client";

import { useMemo, useState } from "react";
import { AnalyticsOverview, AnalyticsTimeseries, RequestLog } from "@/lib/types";
import { mockTopEndpoints } from "@/lib/mock-data";

export type AnalyticsFilters = {
  from: string;
  to: string;
  range: "1H" | "24H" | "7D" | "30D";
};

type Props = {
  overview: AnalyticsOverview | null;
  timeseries: AnalyticsTimeseries | null;
  logsPreview: RequestLog[];
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  onChangeFilters: (next: AnalyticsFilters) => void;
  onRefresh: () => Promise<void>;
};

function toSparkline(values: number[], width = 280, height = 50): string {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  return values
    .map((value, idx) => {
      const x = (idx / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function toArea(values: number[], width = 640, height = 220): string {
  const points = toSparkline(values, width, height);
  if (!points) return "";
  return `0,${height} ${points} ${width},${height}`;
}

export function AnalyticsPanel({
  overview,
  timeseries,
  logsPreview,
  loading,
  error,
  filters,
  onChangeFilters,
  onRefresh,
}: Props) {
  const [busyRefresh, setBusyRefresh] = useState(false);
  const requests = useMemo(
    () => (timeseries?.points ?? []).map((point) => point.requests),
    [timeseries],
  );
  const errors = useMemo(() => (timeseries?.points ?? []).map((point) => point.errors), [timeseries]);

  const reqSpark = useMemo(() => toSparkline(requests), [requests]);
  const errSpark = useMemo(() => toSparkline(errors), [errors]);
  const areaPoints = useMemo(() => toArea(requests), [requests]);
  const linePoints = useMemo(() => toSparkline(requests, 640, 220), [requests]);
  const errorLinePoints = useMemo(() => toSparkline(errors, 640, 220), [errors]);

  function downloadCsv() {
    const header = "timestamp,method,path,status,latency,key\n";
    const rows = logsPreview
      .map((row) => `${row.created_at},${row.method},${row.path},${row.status_code},${row.latency_ms},${row.key_id ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wonkey-usage-preview.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const endpointGradient = `conic-gradient(${mockTopEndpoints
    .map((item, idx) => {
      const start = mockTopEndpoints.slice(0, idx).reduce((sum, curr) => sum + curr.value, 0);
      return `${item.color} ${start}% ${start + item.value}%`;
    })
    .join(", ")})`;

  return (
    <section className="stack">
      {error ? (
        <div className="card" style={{ padding: 14, color: "var(--danger)", borderColor: "#efc6c9" }}>
          {error}
        </div>
      ) : null}

      <div className="stats-grid">
        <article className="card soft-shadow" style={{ padding: 16 }}>
          <div className="split-row">
            <strong>Total Requests</strong>
            <span className="muted">+8.2%</span>
          </div>
          <div style={{ fontSize: 46, marginTop: 6, fontWeight: 700 }}>{overview?.total_requests ?? 0}</div>
          <div className="sparkline-wrap">
            <svg viewBox="0 0 280 50" width="100%" height="50" preserveAspectRatio="none">
              <polyline points={reqSpark} fill="none" stroke="#44a7a2" strokeWidth="2.2" />
            </svg>
          </div>
        </article>

        <article className="card soft-shadow" style={{ padding: 16 }}>
          <div className="split-row">
            <strong>Total Errors</strong>
            <span style={{ color: "#bf5f66" }}>+{overview?.total_errors ?? 0}</span>
          </div>
          <div style={{ fontSize: 46, marginTop: 6, fontWeight: 700 }}>{overview?.total_errors ?? 0}</div>
          <div className="sparkline-wrap">
            <svg viewBox="0 0 280 50" width="100%" height="50" preserveAspectRatio="none">
              <polyline points={errSpark} fill="none" stroke="#d68a96" strokeWidth="2.2" />
            </svg>
          </div>
        </article>

        <article className="card soft-shadow" style={{ padding: 16 }}>
          <div className="split-row">
            <strong>7-day Active Users</strong>
            <span className="muted">+15%</span>
          </div>
          <div style={{ fontSize: 46, marginTop: 6, fontWeight: 700 }}>
            {Math.max(1, Math.round((overview?.total_requests ?? 708) / 3))}
          </div>
          <div className="sparkline-wrap">
            <svg viewBox="0 0 280 50" width="100%" height="50" preserveAspectRatio="none">
              <polyline points={reqSpark} fill="none" stroke="#86b8b3" strokeWidth="2.2" />
            </svg>
          </div>
        </article>
      </div>

      <div className="analytics-grid">
        <article className="card soft-shadow" style={{ padding: 18 }}>
          <div className="split-row" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Requests Over Time</h3>
            <div className="pill-group">
              {(["1H", "24H", "7D", "30D"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`pill ${filters.range === option ? "is-active" : ""}`}
                  onClick={() => onChangeFilters({ ...filters, range: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #eee4d4", borderRadius: 12, padding: 10, background: "#fffcf7" }}>
            <svg viewBox="0 0 640 240" width="100%" height="240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(68,167,162,0.36)" />
                  <stop offset="100%" stopColor="rgba(68,167,162,0.02)" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#requestsFill)" />
              <polyline points={linePoints} fill="none" stroke="#43a9a4" strokeWidth="2.5" />
              <polyline points={errorLinePoints} fill="none" stroke="#cc7a85" strokeWidth="1.8" />
            </svg>
          </div>

          <div className="split-row" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="badge" style={{ color: "#267f79" }}>
                Successes
              </span>
              <span className="badge" style={{ color: "#ae5e66" }}>
                Errors
              </span>
            </div>
            <button
              type="button"
              className="button button-soft"
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
        </article>

        <article className="card soft-shadow" style={{ padding: 18 }}>
          <div className="split-row">
            <h3 style={{ margin: 0 }}>Top Endpoints</h3>
            <span className="badge">Last 30 days</span>
          </div>
          <div style={{ display: "grid", placeItems: "center", padding: "14px 0" }}>
            <div
              style={{
                width: 190,
                height: 190,
                borderRadius: "50%",
                background: endpointGradient,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 45,
                  borderRadius: "50%",
                  background: "#fffaf2",
                  border: "1px solid #eee4d6",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 36,
                  fontWeight: 700,
                }}
              >
                50.8%
              </div>
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {mockTopEndpoints.map((row) => (
              <div key={row.label} className="split-row">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: row.color }} />
                  <span>{row.label}</span>
                </div>
                <strong>{row.value}%</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="card soft-shadow" style={{ padding: 16 }}>
        <div className="split-row">
          <h3 style={{ margin: 0 }}>Usage Logs</h3>
          <button type="button" className="button button-primary" onClick={downloadCsv}>
            Download CSV
          </button>
        </div>

        <div style={{ margin: "10px 0 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="badge">All</span>
          <span className="badge">Status</span>
          <span className="badge">Last 30 days</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Key</th>
              </tr>
            </thead>
            <tbody>
              {logsPreview.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No recent logs in this window.
                  </td>
                </tr>
              ) : (
                logsPreview.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString()}</td>
                    <td>
                      <span className="badge">{row.method}</span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono), monospace" }}>{row.path}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          row.status_code >= 400 ? "status-revoked" : "status-active"
                        }`}
                      >
                        {row.status_code}
                      </span>
                    </td>
                    <td>{row.latency_ms}ms</td>
                    <td>{row.key_id ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
