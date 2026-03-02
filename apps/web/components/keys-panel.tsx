"use client";

import { useMemo, useState } from "react";
import { ApiKey, ApiKeyCreateResult } from "@/lib/types";

type Props = {
  initialKeys: ApiKey[];
  onCreate: () => Promise<ApiKeyCreateResult>;
  onRevoke: (keyId: string) => Promise<void>;
};

export function KeysPanel({ initialKeys, onCreate, onRevoke }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyRevoke, setBusyRevoke] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const activeCount = useMemo(() => keys.filter((k) => k.status === "active").length, [keys]);

  async function createKey() {
    setBusyCreate(true);
    try {
      const created = await onCreate();
      setNewRawKey(created.raw_key);
      setKeys((prev) => [created, ...prev]);
    } finally {
      setBusyCreate(false);
    }
  }

  async function revokeKey(id: string) {
    setBusyRevoke(id);
    try {
      await onRevoke(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k)));
    } finally {
      setBusyRevoke(null);
    }
  }

  return (
    <section className="stack">
      <div className="panel" style={{ padding: 16, display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0 }}>API Keys</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {activeCount} active key(s)
          </p>
        </div>
        <button className="button button-primary" onClick={createKey} disabled={busyCreate}>
          {busyCreate ? "Creating..." : "Create Key"}
        </button>
      </div>

      <div className="panel table-wrap">
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
                  <td>
                    <code>{key.key_prefix}</code>
                  </td>
                  <td className={key.status === "active" ? "status-active" : "status-revoked"}>
                    {key.status}
                  </td>
                  <td>{new Date(key.created_at).toLocaleString()}</td>
                  <td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}</td>
                  <td>
                    <button
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
        <div className="panel" style={{ padding: 16, borderColor: "var(--brand)" }}>
          <h4 style={{ marginTop: 0 }}>Copy your new key now</h4>
          <p className="muted">This value is shown once.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input readOnly className="input" value={newRawKey} />
            <button
              className="button button-soft"
              onClick={async () => {
                await navigator.clipboard.writeText(newRawKey);
              }}
            >
              Copy
            </button>
            <button className="button button-soft" onClick={() => setNewRawKey(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
