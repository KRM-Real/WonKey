"use client";

import { useEffect, useState } from "react";
import { createProject, listProjects } from "@/lib/api";
import { Project } from "@/lib/types";
import { CreateProjectForm } from "@/components/create-project-form";
import { ProjectsList } from "@/components/projects-list";
import { mockProjects } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
      } catch (e) {
        if (!cancelled) {
          setUsingMock(true);
          setProjects(mockProjects);
          setError(e instanceof Error ? e.message : "Failed to load projects");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(name: string) {
    if (usingMock) {
      const created: Project = {
        id: `proj_${crypto.randomUUID().slice(0, 8)}`,
        org_id: "org_demo",
        name,
        created_at: new Date().toISOString(),
      };
      setProjects((prev) => [created, ...prev]);
      return;
    }

    try {
      setError(null);
      const created = await createProject(name);
      setProjects((prev) => [created, ...prev]);
    } catch (e) {
      setUsingMock(true);
      setError(e instanceof Error ? `${e.message} (Switched to demo data)` : "Switched to demo data");
      const created: Project = {
        id: `proj_${crypto.randomUUID().slice(0, 8)}`,
        org_id: "org_demo",
        name,
        created_at: new Date().toISOString(),
      };
      setProjects((prev) => [created, ...prev]);
    }
  }

  return (
    <section className="space-y-6">
      {usingMock ? <Badge variant="yellow">Using demo project data</Badge> : null}
      <CreateProjectForm onCreate={onCreate} />
      {loading ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-500">Loading projects...</CardContent>
        </Card>
      ) : null}
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}
      {!loading ? <ProjectsList projects={projects} /> : null}
    </section>
  );
}
