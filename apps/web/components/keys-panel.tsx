"use client";

import { useMemo, useState } from "react";
import { Check, Copy, KeyRound, ShieldAlert } from "lucide-react";
import { ApiKey, ApiKeyCreateResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

type Props = {
  keys: ApiKey[];
  error: string | null;
  loading?: boolean;
  onCreate: () => Promise<ApiKeyCreateResult>;
  onRevoke: (keyId: string) => Promise<void>;
};

export function KeysPanel({ keys, error, loading = false, onCreate, onRevoke }: Props) {
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyRevoke, setBusyRevoke] = useState<string | null>(null);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const activeCount = useMemo(() => keys.filter((k) => k.status === "active").length, [keys]);

  async function createKey() {
    setBusyCreate(true);
    try {
      const created = await onCreate();
      setNewRawKey(created.raw_key);
      setCopied(false);
    } finally {
      setBusyCreate(false);
    }
  }

  async function revokeKey(id: string) {
    setBusyRevoke(id);
    try {
      await onRevoke(id);
    } finally {
      setBusyRevoke(null);
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Issue, review, and revoke keys used by your consumers.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="blue">{activeCount} active</Badge>
            <Button type="button" onClick={createKey} disabled={busyCreate}>
              <KeyRound className="h-4 w-4" />
              {busyCreate ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Prefix</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium">Last Used</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        No keys yet. Create your first key to start sending authenticated traffic.
                      </td>
                    </tr>
                  ) : (
                    keys.map((key) => (
                      <tr key={key.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700">{key.key_prefix}</td>
                        <td className="px-5 py-4">
                          <Badge variant={key.status === "active" ? "green" : "red"}>{key.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{formatDateTime(key.created_at)}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {key.last_used_at ? formatDateTime(key.last_used_at) : "Never"}
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={key.status !== "active" || busyRevoke === key.id}
                            onClick={() => revokeKey(key.id)}
                          >
                            {busyRevoke === key.id ? "Revoking..." : "Revoke key"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-red-700">
            <ShieldAlert className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      ) : null}

      {newRawKey ? (
        <Card className="border-blue-100 bg-blue-50/60">
          <CardHeader>
            <CardTitle>Copy your new key now</CardTitle>
            <CardDescription>This value is shown once. Store it before dismissing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white px-4 py-3 font-mono text-sm text-slate-800">
              {newRawKey}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(newRawKey);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setNewRawKey(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
