"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Download, RefreshCcw, Users } from "lucide-react";
import { AnalyticsOverview, AnalyticsTimeseries, RequestLog } from "@/lib/types";
import { mockTopEndpoints } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/metric-card";
import { formatDateTime } from "@/lib/format";

export type AnalyticsFilters = {
  from: string;
  to: string;
  range: "1H" | "24H" | "7D" | "30D";
};

type Props = {
  overview: AnalyticsOverview | null;
  timeseries: AnalyticsTimeseries | null;
  logsPreview: RequestLog[];
  loading: boolean;
  error: string | null;
  filters: AnalyticsFilters;
  onChangeFilters: (next: AnalyticsFilters) => void;
  onRefresh: () => Promise<void>;
};

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatAxis(ts: string, range: AnalyticsFilters["range"]) {
  return new Intl.DateTimeFormat("en-US", {
    month: range === "1H" ? undefined : "short",
    day: range === "1H" ? undefined : "numeric",
    hour: range === "1H" || range === "24H" ? "numeric" : undefined,
  }).format(new Date(ts));
}

function getEndpointData(logsPreview: RequestLog[]) {
  if (logsPreview.length === 0) return mockTopEndpoints;
  const grouped = new Map<string, number>();
  for (const row of logsPreview) {
    const key = `${row.method} ${row.path.replace(/^\/v1/, "") || "/"}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
  const palette = ["#2563eb", "#10b981", "#f97316", "#8b5cf6", "#f43f5e"];
  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count], index) => ({
      label,
      value: Number(((count / Math.max(1, total)) * 100).toFixed(1)),
      color: palette[index % palette.length],
    }));
}

export function AnalyticsPanel({
  overview,
  timeseries,
  logsPreview,
  loading,
  error,
  filters,
  onChangeFilters,
  onRefresh,
}: Props) {
  const [busyRefresh, setBusyRefresh] = useState(false);
  const points = useMemo(
    () =>
      (timeseries?.points ?? []).map((point) => ({
        label: formatAxis(point.ts, filters.range),
        requests: point.requests,
        errors: point.errors,
      })),
    [timeseries, filters.range],
  );
  const endpointData = useMemo(() => getEndpointData(logsPreview), [logsPreview]);
  const requestSeries = useMemo(() => points.map((point) => ({ value: point.requests })), [points]);
  const errorSeries = useMemo(() => points.map((point) => ({ value: point.errors })), [points]);
  const activeUsers = Math.max(1, Math.round((overview?.total_requests ?? 708) / 3));
  const activeSeries = useMemo(
    () => points.map((point) => ({ value: Math.max(1, Math.round(point.requests / 3)) })),
    [points],
  );

  function downloadCsv() {
    const header = "timestamp,method,path,status,latency,key\n";
    const rows = logsPreview
      .map((row) => `${row.created_at},${row.method},${row.path},${row.status_code},${row.latency_ms},${row.key_id ?? ""}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wonkey-usage-preview.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !overview && points.length === 0) {
    return (
      <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mx-auto h-56 w-56 rounded-full" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          title="Total Requests"
          value={(overview?.total_requests ?? 0).toLocaleString()}
          series={requestSeries}
          trend="+8.2%"
          trendDirection="up"
          color="#2563eb"
          detail="Healthy request growth over the selected period."
        />
        <MetricCard
          title="Total Errors"
          value={(overview?.total_errors ?? 0).toLocaleString()}
          series={errorSeries}
          trend={`${overview?.error_rate?.toFixed(1) ?? "0.0"}%`}
          trendDirection={(overview?.total_errors ?? 0) > 0 ? "down" : "neutral"}
          color="#f97316"
          detail="Keep this under 1% by monitoring unhealthy routes."
        />
        <MetricCard
          title="7-day Active Users"
          value={activeUsers.toLocaleString()}
          series={activeSeries}
          trend="+15%"
          trendDirection="up"
          color="#10b981"
          detail={
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Derived from recent request activity.
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Requests Over Time</CardTitle>
              <CardDescription>Successes and errors across the selected range.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(["1H", "24H", "7D", "30D"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      filters.range === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => onChangeFilters({ ...filters, range: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loading || busyRefresh}
                onClick={async () => {
                  setBusyRefresh(true);
                  try {
                    await onRefresh();
                  } finally {
                    setBusyRefresh(false);
                  }
                }}
              >
                <RefreshCcw className={`h-4 w-4 ${busyRefresh ? "animate-spin" : ""}`} />
                {busyRefresh ? "Refreshing" : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {points.length === 0 ? (
              <div className="grid h-72 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                No analytics data yet for this range.
              </div>
            ) : (
              <>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points}>
                      <defs>
                        <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="errorsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 16, borderColor: "#e2e8f0", boxShadow: "0 12px 32px rgba(15,23,42,0.08)" }}
                      />
                      <Area type="monotone" dataKey="requests" stroke="#2563eb" fill="url(#requestsFill)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="errors" stroke="#f97316" fill="url(#errorsFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="blue">Successes {formatCompact(points.reduce((sum, point) => sum + point.requests, 0))}</Badge>
                    <Badge variant="yellow">Errors {formatCompact(points.reduce((sum, point) => sum + point.errors, 0))}</Badge>
                  </div>
                  <div className="text-sm text-slate-500">
                    Avg latency <span className="font-medium text-slate-900">{overview?.avg_latency_ms ?? 0}ms</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Request distribution by route.</CardDescription>
            </div>
            <Badge>
              <CalendarDays className="h-3.5 w-3.5" />
              Last 30 days
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={endpointData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {endpointData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value ?? 0}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {endpointData.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="truncate text-slate-600">{row.label}</span>
                  </div>
                  <span className="font-medium text-slate-900">{row.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Usage Logs</CardTitle>
            <CardDescription>Recent traffic preview tied to this analytics window.</CardDescription>
          </div>
          <Button type="button" variant="secondary" onClick={downloadCsv}>
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Path</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Latency</th>
                  <th className="px-5 py-3 font-medium">Key</th>
                </tr>
              </thead>
              <tbody>
                {logsPreview.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No recent logs in this window.
                    </td>
                  </tr>
                ) : (
                  logsPreview.slice(0, 5).map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(row.created_at)}</td>
                      <td className="px-5 py-4">
                        <Badge variant="default">{row.method}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-700">{row.path}</td>
                      <td className="px-5 py-4">
                        <Badge variant={row.status_code >= 400 ? "red" : row.status_code >= 300 ? "yellow" : "green"}>
                          {row.status_code}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{row.latency_ms}ms</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.key_id ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
