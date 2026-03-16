"use client";

import dynamic from "next/dynamic";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createProjectKey,
  getProjectLimits,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  listProjectKeys,
  listProjectLogs,
  listProjects,
  revokeKey,
  updateProjectLimits,
} from "@/lib/api";
import { AnalyticsOverview, AnalyticsTimeseries, ApiKey, RequestLog, UsageLimitConfig } from "@/lib/types";
import {
  mockKeysByProject,
  mockLogsByProject,
  mockOverviewByProject,
  mockProjects,
  mockTimeseriesByProject,
} from "@/lib/mock-data";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsFilters } from "@/components/analytics-panel";
import type { LogsFilters } from "@/components/logs-panel";

function PanelFallback({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-slate-500">Loading {label}...</CardContent>
    </Card>
  );
}

const AnalyticsPanel = dynamic(
  () => import("@/components/analytics-panel").then((mod) => mod.AnalyticsPanel),
  { loading: () => <PanelFallback label="analytics" /> },
);
const KeysPanel = dynamic(() => import("@/components/keys-panel").then((mod) => mod.KeysPanel), {
  loading: () => <PanelFallback label="keys" />,
});
const LogsPanel = dynamic(() => import("@/components/logs-panel").then((mod) => mod.LogsPanel), {
  loading: () => <PanelFallback label="logs" />,
});
const SettingsPanel = dynamic(
  () => import("@/components/settings-panel").then((mod) => mod.SettingsPanel),
  { loading: () => <PanelFallback label="settings" /> },
);
const UsageLimitsPanel = dynamic(
  () => import("@/components/usage-limits-panel").then((mod) => mod.UsageLimitsPanel),
  { loading: () => <PanelFallback label="usage limits" /> },
);

type Tab = "keys" | "limits" | "logs" | "analytics" | "settings";

type Props = {
  projectId: string;
  tab: Tab;
};

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function fromRange(range: "1H" | "24H" | "7D" | "30D" | "24h" | "7d" | "30d"): string {
  const now = Date.now();
  const map: Record<string, number> = {
    "1H": 1000 * 60 * 60,
    "24H": 1000 * 60 * 60 * 24,
    "7D": 1000 * 60 * 60 * 24 * 7,
    "30D": 1000 * 60 * 60 * 24 * 30,
    "24h": 1000 * 60 * 60 * 24,
    "7d": 1000 * 60 * 60 * 24 * 7,
    "30d": 1000 * 60 * 60 * 24 * 30,
  };
  return new Date(now - map[range]).toISOString();
}

export function ProjectDetailClient({ projectId, tab }: Props) {
  const [projectName, setProjectName] = useState("Payments API");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<AnalyticsTimeseries | null>(null);
  const [limits, setLimits] = useState<UsageLimitConfig>({
    requestsPerMinute: 300,
    windowSeconds: 60,
    burst: 40,
  });

  const [keysLoading, setKeysLoading] = useState(tab === "keys");
  const [logsLoading, setLogsLoading] = useState(tab === "logs");
  const [analyticsLoading, setAnalyticsLoading] = useState(tab === "analytics");
  const [keysError, setKeysError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [limitsError, setLimitsError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [limitsLoading, setLimitsLoading] = useState(false);

  const [logsFilters, setLogsFilters] = useState<LogsFilters>({
    status: "",
    query: "",
    range: "30d",
    limit: "100",
    from: "",
    to: "",
  });

  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFilters>({
    from: "",
    to: "",
    range: "7D",
  });

  const logsFiltersRef = useRef(logsFilters);
  const analyticsFiltersRef = useRef(analyticsFilters);
  const loadedTabsRef = useRef<Record<string, boolean>>({
    keys: false,
    limits: false,
    logs: false,
    analytics: false,
  });

  useEffect(() => {
    logsFiltersRef.current = logsFilters;
  }, [logsFilters]);

  useEffect(() => {
    analyticsFiltersRef.current = analyticsFilters;
  }, [analyticsFilters]);

  useEffect(() => {
    loadedTabsRef.current = {
      keys: false,
      limits: false,
      logs: false,
      analytics: false,
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const projects = await listProjects();
        if (cancelled) return;
        const current = projects.find((row) => row.id === projectId);
        if (current) setProjectName(current.name);
      } catch {
        const current = mockProjects.find((row) => row.id === projectId) ?? mockProjects[0];
        if (!cancelled && current) setProjectName(current.name);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const rows = await listProjectKeys(projectId);
      setKeys(rows);
      setUsingMock(false);
      loadedTabsRef.current.keys = true;
    } catch (e) {
      setUsingMock(true);
      setKeys(mockKeysByProject[projectId] ?? mockKeysByProject.proj_payments ?? []);
      setKeysError(e instanceof Error ? e.message : "Failed to load keys");
      loadedTabsRef.current.keys = true;
    } finally {
      setKeysLoading(false);
    }
  }, [projectId]);

  const loadLimits = useCallback(async () => {
    setLimitsLoading(true);
    setLimitsError(null);
    try {
      const next = await getProjectLimits(projectId);
      setLimits(next);
      setUsingMock(false);
      loadedTabsRef.current.limits = true;
    } catch (e) {
      setUsingMock(true);
      setLimitsError(e instanceof Error ? `${e.message} (Using current/demo limits)` : "Using current/demo limits");
      loadedTabsRef.current.limits = true;
    } finally {
      setLimitsLoading(false);
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
        const from = toIsoOrUndefined(filters.from) ?? fromRange(filters.range);
        const to = toIsoOrUndefined(filters.to) ?? new Date().toISOString();
        const rows = await listProjectLogs(projectId, {
          status: Number.isFinite(statusParsed) ? statusParsed : undefined,
          path: filters.query || undefined,
          from,
          to,
          limit: Number.isFinite(limitParsed) ? limitParsed : undefined,
        });
        setLogs(rows);
        setUsingMock(false);
        loadedTabsRef.current.logs = true;
      } catch (e) {
        setUsingMock(true);
        const fromFloor = new Date(toIsoOrUndefined(filters.from) ?? fromRange(filters.range)).getTime();
        const toCeiling = new Date(toIsoOrUndefined(filters.to) ?? new Date().toISOString()).getTime();
        let rows = [...(mockLogsByProject[projectId] ?? mockLogsByProject.proj_payments ?? [])];
        rows = rows.filter((row) => {
          const timestamp = new Date(row.created_at).getTime();
          return timestamp >= fromFloor && timestamp <= toCeiling;
        });
        if (filters.status) {
          rows = rows.filter((row) => String(row.status_code) === filters.status);
        }
        if (filters.query) {
          rows = rows.filter((row) => row.path.toLowerCase().includes(filters.query.toLowerCase()));
        }
        if (filters.limit && Number.isFinite(Number(filters.limit))) {
          rows = rows.slice(0, Number(filters.limit));
        }
        setLogs(rows);
        setLogsError(e instanceof Error ? e.message : "Failed to load logs");
        loadedTabsRef.current.logs = true;
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
        const from = toIsoOrUndefined(filters.from) ?? fromRange(filters.range);
        const to = toIsoOrUndefined(filters.to) ?? new Date().toISOString();
        const [overviewData, timeseriesData, recentLogs] = await Promise.all([
          getAnalyticsOverview(projectId, from, to),
          getAnalyticsTimeseries(projectId, "hour", from, to),
          listProjectLogs(projectId, { from, to, limit: 10 }),
        ]);
        setOverview(overviewData);
        setTimeseries(timeseriesData);
        setLogs(recentLogs);
        setUsingMock(false);
        loadedTabsRef.current.analytics = true;
      } catch (e) {
        setUsingMock(true);
        setOverview(mockOverviewByProject[projectId] ?? mockOverviewByProject.proj_payments ?? null);
        setTimeseries(mockTimeseriesByProject[projectId] ?? mockTimeseriesByProject.proj_payments ?? null);
        setLogs(mockLogsByProject[projectId] ?? mockLogsByProject.proj_payments ?? []);
        setAnalyticsError(e instanceof Error ? e.message : "Failed to load analytics");
        loadedTabsRef.current.analytics = true;
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    if (tab === "keys" && !loadedTabsRef.current.keys) void loadKeys();
    if (tab === "limits" && !loadedTabsRef.current.limits) void loadLimits();
    if (tab === "logs" && !loadedTabsRef.current.logs) void loadLogs();
    if (tab === "analytics" && !loadedTabsRef.current.analytics) void loadAnalytics();
  }, [tab, loadKeys, loadLimits, loadLogs, loadAnalytics]);

  useEffect(() => {
    if (tab !== "analytics") return;
    const id = window.setInterval(() => {
      void loadAnalytics();
    }, 15000);
    return () => window.clearInterval(id);
  }, [tab, loadAnalytics]);

  const hasLoadedAnyData = useMemo(
    () => keys.length > 0 || logs.length > 0 || Boolean(overview) || Boolean(timeseries),
    [keys.length, logs.length, overview, timeseries],
  );

  return (
    <DashboardLayout projectId={projectId} projectName={projectName} activeTab={tab} usingMock={usingMock}>
      <div className="transition-opacity duration-200">
        {tab === "limits" ? (
          <UsageLimitsPanel
            initialValue={limits}
            loading={limitsLoading}
            error={limitsError}
            onSave={async (next) => {
              try {
                setLimitsError(null);
                const saved = await updateProjectLimits(projectId, next);
                setLimits(saved);
              } catch (e) {
                setUsingMock(true);
                setLimits(next);
                setLimitsError(
                  e instanceof Error ? `${e.message} (Saved locally for demo)` : "Saved locally for demo",
                );
              }
            }}
          />
        ) : null}

        {tab === "logs" ? (
          <LogsPanel
            logs={logs}
            loading={logsLoading}
            error={logsError}
            filters={logsFilters}
            onChangeFilters={(next) => {
              startTransition(() => setLogsFilters(next));
            }}
            onApply={async () => loadLogs(logsFilters)}
            onReset={async () => {
              const reset: LogsFilters = {
                status: "",
                query: "",
                range: "30d",
                limit: "100",
                from: "",
                to: "",
              };
              setLogsFilters(reset);
              await loadLogs(reset);
            }}
          />
        ) : null}

        {tab === "analytics" ? (
          <AnalyticsPanel
            overview={overview}
            timeseries={timeseries}
            logsPreview={logs}
            loading={analyticsLoading}
            error={analyticsError}
            filters={analyticsFilters}
            onChangeFilters={(next) => {
              startTransition(() => setAnalyticsFilters(next));
            }}
            onRefresh={async () => loadAnalytics(analyticsFilters)}
          />
        ) : null}

        {tab === "keys" ? (
          <KeysPanel
            keys={keys}
            loading={keysLoading}
            error={keysError}
            onCreate={async () => {
              try {
                setKeysError(null);
                const created = await createProjectKey(projectId);
                setKeys((prev) => [created, ...prev]);
                return created;
              } catch (e) {
                setUsingMock(true);
                setKeysError(
                  e instanceof Error ? `${e.message} (Created demo key instead)` : "Created demo key instead",
                );
                const created = {
                  id: `key_${crypto.randomUUID().slice(0, 8)}`,
                  project_id: projectId,
                  key_prefix: `wk_live_${Math.random().toString(36).slice(2, 8)}`,
                  status: "active",
                  created_at: new Date().toISOString(),
                  last_used_at: null,
                  raw_key: `wk_live_${crypto.randomUUID().replace(/-/g, "")}`,
                };
                setKeys((prev) => [created, ...prev]);
                return created;
              }
            }}
            onRevoke={async (keyId) => {
              try {
                setKeysError(null);
                await revokeKey(keyId);
                setKeys((prev) => prev.map((row) => (row.id === keyId ? { ...row, status: "revoked" } : row)));
              } catch (e) {
                setKeysError(e instanceof Error ? e.message : "Failed to revoke key");
              }
            }}
          />
        ) : null}

        {tab === "settings" ? (
          <SettingsPanel projectId={projectId} projectName={projectName} usingMock={usingMock} />
        ) : null}

        {!hasLoadedAnyData && tab !== "limits" && tab !== "settings" ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No data yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                This project will populate as soon as requests are sent with an active key.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
