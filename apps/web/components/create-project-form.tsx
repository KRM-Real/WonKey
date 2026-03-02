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
    <form onSubmit={submit} className="panel" style={{ padding: 18 }}>
      <div className="stack">
        <label htmlFor="project-name" style={{ fontWeight: 600 }}>
          Create project
        </label>
        <input
          id="project-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. payments-api"
        />
        <button className="button button-primary" disabled={busy || !name.trim()} type="submit">
          {busy ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}
