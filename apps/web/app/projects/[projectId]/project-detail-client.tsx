"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createProjectKey,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  listProjectKeys,
  listProjectLogs,
  revokeKey,
} from "@/lib/api";
import { AnalyticsOverview, AnalyticsTimeseries, ApiKey, RequestLog } from "@/lib/types";
import { AnalyticsPanel, AnalyticsFilters } from "@/components/analytics-panel";
import { KeysPanel } from "@/components/keys-panel";
import { LogsFilters, LogsPanel } from "@/components/logs-panel";
import { ProjectTabs } from "@/components/project-tabs";
import { LimitsPlaceholder } from "@/components/placeholders";

type Tab = "keys" | "limits" | "logs" | "analytics";

type Props = {
  projectId: string;
  tab: Tab;
};

export function ProjectDetailClient({ projectId, tab }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseries | null>(null);

  const [keysLoading, setKeysLoading] = useState(tab === "keys");
  const [logsLoading, setLogsLoading] = useState(tab === "logs");
  const [analyticsLoading, setAnalyticsLoading] = useState(tab === "analytics");

  const [keysError, setKeysError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const [logsFilters, setLogsFilters] = useState<LogsFilters>({
    status: "",
    path: "",
    from: "",
    to: "",
    limit: "100",
  });
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({
    from: "",
    to: "",
  });
  const logsFiltersRef = useRef(logsFilters);
  const analyticsFiltersRef = useRef(analyticsFilters);

  function asIso(value: string): string | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  useEffect(() => {
    logsFiltersRef.current = logsFilters;
  }, [logsFilters]);

  useEffect(() => {
    analyticsFiltersRef.current = analyticsFilters;
  }, [analyticsFilters]);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const rows = await listProjectKeys(projectId);
      setKeys(rows);
    } catch (e) {
      setKeysError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setKeysLoading(false);
    }
  }, [projectId]);

  const loadLogs = useCallback(
    async (nextFilters?: LogsFilters) => {
      const filters = nextFilters ?? logsFiltersRef.current;
    setLogsLoading(true);
    setLogsError(null);
    try {
        const statusParsed = filters.status ? Number(filters.status) : undefined;
        const limitParsed = filters.limit ? Number(filters.limit) : undefined;
      const rows = await listProjectLogs(projectId, {
        status: Number.isFinite(statusParsed) ? statusParsed : undefined,
          path: filters.path || undefined,
          from: asIso(filters.from),
          to: asIso(filters.to),
        limit: Number.isFinite(limitParsed) ? limitParsed : undefined,
      });
      setLogs(rows);
    } catch (e) {
      setLogsError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
    },
    [projectId],
  );

  const loadAnalytics = useCallback(
    async (nextFilters?: AnalyticsFilters) => {
      const filters = nextFilters ?? analyticsFiltersRef.current;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
        const from = asIso(filters.from);
        const to = asIso(filters.to);
      const [overviewData, timeseriesData] = await Promise.all([
        getAnalyticsOverview(projectId, from, to),
        getAnalyticsTimeseries(projectId, "hour", from, to),
      ]);
      setOverview(overviewData);
      setTimeseries(timeseriesData);
    } catch (e) {
      setAnalyticsError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
    },
    [projectId],
  );

  useEffect(() => {
    if (tab === "keys") {
      void loadKeys();
    }
    if (tab === "logs") {
      void loadLogs();
    }
    if (tab === "analytics") {
      void loadAnalytics();
    }
  }, [tab, projectId, loadAnalytics, loadKeys, loadLogs]);

  if (tab === "limits") {
    return (
      <section className="stack">
        <div className="panel" style={{ padding: 16 }}>
          <h1 style={{ margin: 0 }}>Project Detail</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            <code>{projectId}</code>
          </p>
        </div>
        <ProjectTabs projectId={projectId} />
        <LimitsPlaceholder />
      </section>
    );
  }

  if (tab === "logs") {
    return (
      <section className="stack">
        <div className="panel" style={{ padding: 16 }}>
          <h1 style={{ margin: 0 }}>Project Detail</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            <code>{projectId}</code>
          </p>
        </div>
        <ProjectTabs projectId={projectId} />
        <LogsPanel
          logs={logs}
          loading={logsLoading}
          error={logsError}
          filters={logsFilters}
          onChangeFilters={setLogsFilters}
          onApply={async () => loadLogs(logsFilters)}
          onReset={async () => {
            const reset = { status: "", path: "", from: "", to: "", limit: "100" };
            setLogsFilters(reset);
            await loadLogs(reset);
          }}
        />
      </section>
    );
  }

  if (tab === "analytics") {
    return (
      <section className="stack">
        <div className="panel" style={{ padding: 16 }}>
          <h1 style={{ margin: 0 }}>Project Detail</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            <code>{projectId}</code>
          </p>
        </div>
        <ProjectTabs projectId={projectId} />
        <AnalyticsPanel
          overview={overview}
          timeseries={timeseries}
          loading={analyticsLoading}
          error={analyticsError}
          filters={analyticsFilters}
          onChangeFilters={setAnalyticsFilters}
          onRefresh={async () => loadAnalytics(analyticsFilters)}
        />
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="panel" style={{ padding: 16 }}>
        <h1 style={{ margin: 0 }}>Project Detail</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          <code>{projectId}</code>
        </p>
      </div>
      <ProjectTabs projectId={projectId} />
      {keysLoading ? <div className="panel" style={{ padding: 16 }}>Loading keys...</div> : null}
      {keysError ? (
        <div className="panel" style={{ padding: 16, borderColor: "#fecdd3", color: "var(--danger)" }}>
          {keysError}
        </div>
      ) : null}
      {!keysLoading && !keysError ? (
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
      ) : null}
    </section>
  );
}
