"use client";

import { useMemo, useState } from "react";
import { ApiKey, ApiKeyCreateResult } from "@/lib/types";

type Props = {
  keys: ApiKey[];
  error: string | null;
  onCreate: () => Promise<ApiKeyCreateResult>;
  onRevoke: (keyId: string) => Promise<void>;
};

export function KeysPanel({ keys, error, onCreate, onRevoke }: Props) {
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyRevoke, setBusyRevoke] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const activeCount = useMemo(() => keys.filter((k) => k.status === "active").length, [keys]);

  async function createKey() {
    setBusyCreate(true);
    try {
      const created = await onCreate();
      setNewRawKey(created.raw_key);
    } finally {
      setBusyCreate(false);
    }
  }

  async function revokeKey(id: string) {
    setBusyRevoke(id);
    try {
      await onRevoke(id);
    } finally {
      setBusyRevoke(null);
    }
  }

  return (
    <section className="stack">
      <div className="card soft-shadow" style={{ padding: 16, display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0 }}>API Keys</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {activeCount} active key(s)
          </p>
        </div>
        <button className="button button-primary" onClick={createKey} disabled={busyCreate} type="button">
          {busyCreate ? "Creating..." : "Create Key"}
        </button>
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
              <th>Prefix</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last used</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No keys yet.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id}>
                  <td style={{ fontFamily: "var(--font-mono), monospace" }}>{key.key_prefix}</td>
                  <td>
                    <span className={`status-badge ${key.status === "active" ? "status-active" : "status-revoked"}`}>
                      {key.status}
                    </span>
                  </td>
                  <td>{new Date(key.created_at).toLocaleString()}</td>
                  <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-danger"
                      disabled={key.status !== "active" || busyRevoke === key.id}
                      onClick={() => revokeKey(key.id)}
                    >
                      {busyRevoke === key.id ? "Revoking..." : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {newRawKey ? (
        <div className="card soft-shadow" style={{ padding: 16, borderColor: "#b9e1dc" }}>
          <h4 style={{ marginTop: 0 }}>Copy your new key now</h4>
          <p className="muted">This value is shown once.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input readOnly className="input" value={newRawKey} />
            <button
              type="button"
              className="button button-soft"
              onClick={async () => {
                await navigator.clipboard.writeText(newRawKey);
              }}
            >
              Copy
            </button>
            <button type="button" className="button button-soft" onClick={() => setNewRawKey(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
