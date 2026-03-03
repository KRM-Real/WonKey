"use client";

import { useState } from "react";
import { RequestLog } from "@/lib/types";

export type LogsFilters = {
  status: string;
  path: string;
  from: string;
  to: string;
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

  return (
    <section className="stack">
      <div className="panel" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>Request Logs</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <input
            className="input"
            placeholder="Status (ex. 200)"
            value={filters.status}
            onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
          />
          <input
            className="input"
            placeholder="Path (ex. /v1/projects)"
            value={filters.path}
            onChange={(e) => onChangeFilters({ ...filters, path: e.target.value })}
          />
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
          <input
            className="input"
            placeholder="Limit (ex. 100)"
            value={filters.limit}
            onChange={(e) => onChangeFilters({ ...filters, limit: e.target.value })}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
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
        <div className="panel" style={{ padding: 16, borderColor: "#fecdd3", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Latency</th>
              <th>IP</th>
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
                  <td>{row.method}</td>
                  <td>
                    <code>{row.path}</code>
                  </td>
                  <td>{row.status_code}</td>
                  <td>{row.latency_ms} ms</td>
                  <td>{row.ip ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
