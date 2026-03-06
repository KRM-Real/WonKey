"use client";

import { useEffect, useState } from "react";
import { UsageLimitConfig } from "@/lib/types";

type Props = {
  initialValue: UsageLimitConfig;
  loading?: boolean;
  onSave: (next: UsageLimitConfig) => Promise<void>;
};

export function UsageLimitsPanel({ initialValue, loading = false, onSave }: Props) {
  const [form, setForm] = useState<UsageLimitConfig>(initialValue);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  async function submit() {
    setBusy(true);
    setSaved(false);
    try {
      await onSave(form);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack">
      <article className="card soft-shadow" style={{ padding: 16 }}>
        <h3 style={{ margin: 0 }}>Project Usage Limits</h3>
        <p className="muted" style={{ marginBottom: 14 }}>
          Configure request quotas per project. Changes apply to new requests immediately.
        </p>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={{ display: "grid", gap: 8 }}>
            Requests per minute
            <input
              className="input"
              type="number"
              min={1}
              value={form.requestsPerMinute}
              disabled={loading}
              onChange={(e) => setForm({ ...form, requestsPerMinute: Number(e.target.value || 1) })}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            Window (seconds)
            <input
              className="input"
              type="number"
              min={1}
              value={form.windowSeconds}
              disabled={loading}
              onChange={(e) => setForm({ ...form, windowSeconds: Number(e.target.value || 60) })}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            Burst
            <input
              className="input"
              type="number"
              min={1}
              value={form.burst}
              disabled={loading}
              onChange={(e) => setForm({ ...form, burst: Number(e.target.value || 10) })}
            />
          </label>
        </div>

        <div className="split-row" style={{ marginTop: 14 }}>
          <span className="muted">Helper: burst lets short spikes pass without instant throttling.</span>
          <button type="button" className="button button-primary" disabled={busy || loading} onClick={submit}>
            {loading ? "Loading..." : busy ? "Saving..." : "Save limits"}
          </button>
        </div>
      </article>

      <article className="card soft-shadow" style={{ padding: 16 }}>
        <div className="split-row">
          <strong>Current limit card</strong>
          {saved ? <span className="badge">Updated</span> : null}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          {form.requestsPerMinute} req/min | window {form.windowSeconds}s | burst {form.burst}
        </p>
      </article>
    </section>
  );
}
