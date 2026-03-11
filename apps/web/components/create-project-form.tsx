"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <Card>
      <CardHeader className="border-b border-slate-100 pb-5">
        <CardTitle>Create project</CardTitle>
        <CardDescription>Create a project to issue API keys, monitor usage, and configure limits.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-4 lg:flex-row">
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Payments API"
            className="lg:flex-1"
          />
          <Button className="lg:self-start" disabled={busy || !name.trim()} type="submit">
            <Plus className="h-4 w-4" />
            {busy ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
