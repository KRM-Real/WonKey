"use client";

import { useEffect, useState } from "react";
import { createProject, listProjects } from "@/lib/api";
import { Project } from "@/lib/types";
import { CreateProjectForm } from "@/components/create-project-form";
import { ProjectsList } from "@/components/projects-list";
import { mockProjects } from "@/lib/mock-data";

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
    <section className="stack">
      {usingMock ? <div className="badge">Using demo project data</div> : null}
      <CreateProjectForm onCreate={onCreate} />
      {loading ? <div className="panel" style={{ padding: 16 }}>Loading projects...</div> : null}
      {error ? (
        <div className="panel" style={{ padding: 16, borderColor: "#efc6c9", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      {!loading && !error ? <ProjectsList projects={projects} /> : null}
    </section>
  );
}
