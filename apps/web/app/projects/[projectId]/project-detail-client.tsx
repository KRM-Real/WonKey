"use client";

import { useEffect, useMemo, useState } from "react";
import { createProjectKey, listProjectKeys, revokeKey } from "@/lib/api";
import { ApiKey } from "@/lib/types";
import { KeysPanel } from "@/components/keys-panel";
import { ProjectTabs } from "@/components/project-tabs";
import { AnalyticsPlaceholder, LimitsPlaceholder, LogsPlaceholder } from "@/components/placeholders";

type Tab = "keys" | "limits" | "logs" | "analytics";

type Props = {
  projectId: string;
  tab: Tab;
};

export function ProjectDetailClient({ projectId, tab }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(tab === "keys");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "keys") return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const rows = await listProjectKeys(projectId);
        if (!cancelled) setKeys(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load keys");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [projectId, tab]);

  const body = useMemo(() => {
    if (tab === "limits") return <LimitsPlaceholder />;
    if (tab === "logs") return <LogsPlaceholder />;
    if (tab === "analytics") return <AnalyticsPlaceholder />;

    if (loading) return <div className="panel" style={{ padding: 16 }}>Loading keys...</div>;
    if (error) {
      return (
        <div className="panel" style={{ padding: 16, borderColor: "#fecdd3", color: "var(--danger)" }}>
          {error}
        </div>
      );
    }

    return (
      <KeysPanel
        initialKeys={keys}
        onCreate={async () => {
          const created = await createProjectKey(projectId);
          setKeys((prev) => [created, ...prev]);
          return created;
        }}
        onRevoke={async (keyId) => {
          await revokeKey(keyId);
          setKeys((prev) => prev.map((row) => (row.id === keyId ? { ...row, status: "revoked" } : row)));
        }}
      />
    );
  }, [error, keys, loading, projectId, tab]);

  return (
    <section className="stack">
      <div className="panel" style={{ padding: 16 }}>
        <h1 style={{ margin: 0 }}>Project Detail</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          <code>{projectId}</code>
        </p>
      </div>
      <ProjectTabs projectId={projectId} />
      {body}
    </section>
  );
}
