"use client";

import { FormEvent, useState } from "react";

type Props = {
  onCreate: (name: string) => Promise<void>;
};

export function CreateProjectForm({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onCreate(name.trim());
      setName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card soft-shadow" style={{ padding: 18 }}>
      <div className="split-row" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px", display: "grid", gap: 8 }}>
          <label htmlFor="project-name" style={{ fontWeight: 600 }}>
            Create project
          </label>
          <input
            id="project-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Payments API"
          />
          <span className="muted" style={{ fontSize: 13 }}>
            Create a project to issue API keys, monitor usage, and configure limits.
          </span>
        </div>
        <button className="button button-primary" disabled={busy || !name.trim()} type="submit">
          {busy ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
