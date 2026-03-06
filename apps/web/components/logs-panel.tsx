"use client";

import { useState } from "react";
import { RequestLog } from "@/lib/types";

export type LogsFilters = {
  status: string;
  query: string;
  range: "24h" | "7d" | "30d";
  limit: string;
};

type Props = {
  logs: RequestLog[];
  loading: boolean;
  error: string | null;
  filters: LogsFilters;
  onChangeFilters: (next: LogsFilters) => void;
  onApply: () => Promise<void>;
  onReset: () => Promise<void>;
};

export function LogsPanel({
  logs,
  loading,
  error,
  filters,
  onChangeFilters,
  onApply,
  onReset,
}: Props) {
  const [busyApply, setBusyApply] = useState(false);
  const [busyReset, setBusyReset] = useState(false);

  function downloadCsv() {
    const header = "timestamp,method,path,status,latency,key\n";
    const rows = logs
      .map((row) => {
        const key = row.key_id ?? "";
        return `${row.created_at},${row.method},${row.path},${row.status_code},${row.latency_ms},${key}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wonkey-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="stack">
      <div className="card soft-shadow" style={{ padding: 16 }}>
        <div className="split-row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Usage Logs</h3>
          <button type="button" className="button button-primary" onClick={downloadCsv}>
            Download CSV
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
          <select
            className="select"
            value={filters.status}
            onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All statuses</option>
            <option value="200">200 OK</option>
            <option value="404">404</option>
            <option value="500">500</option>
          </select>
          <select
            className="select"
            value={filters.range}
            onChange={(e) => onChangeFilters({ ...filters, range: e.target.value as LogsFilters["range"] })}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <input
            className="input"
            placeholder="Search path (ex. /v1/orders)"
            value={filters.query}
            onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
          />
          <input
            className="input"
            placeholder="Rows"
            value={filters.limit}
            onChange={(e) => onChangeFilters({ ...filters, limit: e.target.value })}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            className="button button-primary"
            disabled={busyApply || loading}
            onClick={async () => {
              setBusyApply(true);
              try {
                await onApply();
              } finally {
                setBusyApply(false);
              }
            }}
          >
            {busyApply ? "Applying..." : "Apply filters"}
          </button>
          <button
            type="button"
            className="button button-soft"
            disabled={busyReset || loading}
            onClick={async () => {
              setBusyReset(true);
              try {
                await onReset();
              } finally {
                setBusyReset(false);
              }
            }}
          >
            {busyReset ? "Resetting..." : "Reset"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 16, borderColor: "#efc6c9", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}

      <div className="card table-wrap soft-shadow">
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
            {loading ? (
              <tr>
                <td colSpan={6} className="muted">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No logs found for the current filters.
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString()}</td>
                  <td>
                    <span className="badge">{row.method}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono), monospace" }}>{row.path}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        row.status_code >= 400 ? "status-revoked" : "status-active"
                      }`}
                    >
                      {row.status_code}
                    </span>
                  </td>
                  <td>{row.latency_ms} ms</td>
                  <td>{row.key_id ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
