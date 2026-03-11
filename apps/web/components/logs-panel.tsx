"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { RequestLog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

export type LogsFilters = {
  status: string;
  query: string;
  range: "24h" | "7d" | "30d";
  limit: string;
  from: string;
  to: string;
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

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(1);
  const maxPage = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const visibleRows = useMemo(() => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [logs, page]);

  function downloadCsv() {
    const header = "timestamp,method,path,status,latency,key\n";
    const rows = logs
      .map((row) => {
        const key = row.key_id ?? "";
        return `${row.created_at},${row.method},${row.path},${row.status_code},${row.latency_ms},${key}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wonkey-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Usage Logs</CardTitle>
              <CardDescription>Query request activity with status, path, and date filters.</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={downloadCsv}>
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 xl:grid-cols-6">
            <Select value={filters.status} onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="200">200 OK</option>
              <option value="301">301 Redirect</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Server Error</option>
            </Select>
            <Input
              value={filters.query}
              onChange={(e) => onChangeFilters({ ...filters, query: e.target.value })}
              placeholder="Path contains /orders"
            />
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => onChangeFilters({ ...filters, from: e.target.value })}
            />
            <Input type="date" value={filters.to} onChange={(e) => onChangeFilters({ ...filters, to: e.target.value })} />
            <Select
              value={filters.range}
              onChange={(e) => onChangeFilters({ ...filters, range: e.target.value as LogsFilters["range"] })}
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Select>
            <Input
              value={filters.limit}
              onChange={(e) => onChangeFilters({ ...filters, limit: e.target.value })}
              placeholder="Result limit"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={busyApply || loading}
              onClick={async () => {
                setBusyApply(true);
                try {
                  setPage(1);
                  await onApply();
                } finally {
                  setBusyApply(false);
                }
              }}
            >
              <Filter className="h-4 w-4" />
              {busyApply ? "Applying..." : "Apply filters"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busyReset || loading}
              onClick={async () => {
                setBusyReset(true);
                try {
                  setPage(1);
                  await onReset();
                } finally {
                  setBusyReset(false);
                }
              }}
            >
              {busyReset ? "Resetting..." : "Reset"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
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
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                          No logs found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-5 py-4 text-slate-600">{formatDateTime(row.created_at)}</td>
                          <td className="px-5 py-4">
                            <Badge>{row.method}</Badge>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-700">{row.path}</td>
                          <td className="px-5 py-4">
                            <Badge variant={row.status_code >= 400 ? "red" : row.status_code >= 300 ? "yellow" : "green"}>
                              {row.status_code}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-slate-700">{row.latency_ms} ms</td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.key_id ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <p className="text-sm text-slate-500">
                  {logs.length === 0
                    ? "Showing 0 results"
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, logs.length)} of ${logs.length}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {page} / {maxPage}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    disabled={page >= maxPage}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
