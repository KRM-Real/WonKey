"use client";

import { useEffect, useState } from "react";
import { Gauge, Save } from "lucide-react";
import { UsageLimitConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  initialValue: UsageLimitConfig;
  loading?: boolean;
  error?: string | null;
  onSave: (next: UsageLimitConfig) => Promise<void>;
};

export function UsageLimitsPanel({ initialValue, loading = false, error = null, onSave }: Props) {
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
    <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-5">
          <CardTitle>Usage Limits</CardTitle>
          <CardDescription>Adjust project throughput and window settings. Changes apply immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Requests per minute
              <Input
                type="number"
                min={1}
                value={form.requestsPerMinute}
                disabled={loading}
                onChange={(e) => setForm({ ...form, requestsPerMinute: Number(e.target.value || 1) })}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Window seconds
              <Input
                type="number"
                min={1}
                value={form.windowSeconds}
                disabled={loading}
                onChange={(e) => setForm({ ...form, windowSeconds: Number(e.target.value || 60) })}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Burst allowance
            <Input
              type="number"
              min={1}
              value={form.burst}
              disabled={loading}
              onChange={(e) => setForm({ ...form, burst: Number(e.target.value || 1) })}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Use burst to absorb short spikes without immediate throttling.</p>
            <Button type="button" disabled={busy || loading} onClick={submit}>
              <Save className="h-4 w-4" />
              {loading ? "Loading..." : busy ? "Saving..." : "Save limits"}
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="surface-grid">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between">
            <CardTitle>Current Policy</CardTitle>
            {saved ? <Badge variant="green">Updated</Badge> : null}
          </div>
          <CardDescription>Live configuration summary for this project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">{form.requestsPerMinute} rpm</p>
            <p className="mt-1 text-sm text-slate-500">Primary sustained request budget.</p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Window</span>
              <span className="font-medium text-slate-900">{form.windowSeconds}s</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Burst</span>
              <span className="font-medium text-slate-900">{form.burst} requests</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
