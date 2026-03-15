"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SettingsPrefs = {
  analyticsAutoRefresh: boolean;
  chartRange: "7D" | "30D";
  logTimezone: "UTC" | "Local";
  denseTables: boolean;
};

const STORAGE_KEY = "wonkey:project-settings";

const defaultPrefs: SettingsPrefs = {
  analyticsAutoRefresh: true,
  chartRange: "7D",
  logTimezone: "UTC",
  denseTables: false,
};

type Props = {
  projectId: string;
  projectName: string;
  usingMock: boolean;
};

export function SettingsPanel({ projectId, projectName, usingMock }: Props) {
  const [prefs, setPrefs] = useState<SettingsPrefs>(defaultPrefs);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_KEY}:${projectId}`);
      if (raw) {
        setPrefs({ ...defaultPrefs, ...(JSON.parse(raw) as Partial<SettingsPrefs>) });
      }
    } catch {
      setPrefs(defaultPrefs);
    } finally {
      setReady(true);
    }
  }, [projectId]);

  function persist(next: SettingsPrefs) {
    setPrefs(next);
    setSaved(true);
    window.localStorage.setItem(`${STORAGE_KEY}:${projectId}`, JSON.stringify(next));
    window.setTimeout(() => setSaved(false), 1500);
  }

  if (!ready) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500">Loading project settings...</CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Project metadata and dashboard preferences stored in this browser.</CardDescription>
              </div>
              {saved ? <Badge variant="green">Saved</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Project name
                <Input value={projectName} readOnly />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Project ID
                <div className="flex gap-2">
                  <Input value={projectId} readOnly className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(projectId);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Default analytics range
                <Select
                  value={prefs.chartRange}
                  onChange={(e) => persist({ ...prefs, chartRange: e.target.value as SettingsPrefs["chartRange"] })}
                >
                  <option value="7D">Last 7 days</option>
                  <option value="30D">Last 30 days</option>
                </Select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Log timestamp mode
                <Select
                  value={prefs.logTimezone}
                  onChange={(e) => persist({ ...prefs, logTimezone: e.target.value as SettingsPrefs["logTimezone"] })}
                >
                  <option value="UTC">UTC</option>
                  <option value="Local">Local</option>
                </Select>
              </label>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  <p className="font-medium">Auto-refresh analytics</p>
                  <p className="text-xs text-slate-500">Refresh the analytics tab automatically every 15 seconds.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.analyticsAutoRefresh}
                  onChange={(e) => persist({ ...prefs, analyticsAutoRefresh: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <div>
                  <p className="font-medium">Dense tables</p>
                  <p className="text-xs text-slate-500">Use tighter spacing for keys and logs tables on this device.</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.denseTables}
                  onChange={(e) => persist({ ...prefs, denseTables: e.target.checked })}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-grid">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Operational context for this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Settings2 className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Mode</span>
                <Badge variant={usingMock ? "yellow" : "green"}>{usingMock ? "Demo fallback" : "Live API"}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Auto-refresh</span>
                <span className="font-medium text-slate-900">{prefs.analyticsAutoRefresh ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Preferred range</span>
                <span className="font-medium text-slate-900">{prefs.chartRange}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/70">
        <CardHeader className="border-b border-amber-200/70 pb-5">
          <CardTitle>Reset Local Preferences</CardTitle>
          <CardDescription>
            This only clears browser-stored dashboard preferences for this project. It does not affect backend data.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.localStorage.removeItem(`${STORAGE_KEY}:${projectId}`);
              setPrefs(defaultPrefs);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset preferences
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
