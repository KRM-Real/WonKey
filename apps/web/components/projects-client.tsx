"use client";

import { useEffect, useState } from "react";
import { createProject, listProjects } from "@/lib/api";
import { Project } from "@/lib/types";
import { CreateProjectForm } from "@/components/create-project-form";
import { ProjectsList } from "@/components/projects-list";

export function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load projects");
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
    setError(null);
    const created = await createProject(name);
    setProjects((prev) => [created, ...prev]);
  }

  return (
    <section className="stack">
      <CreateProjectForm onCreate={onCreate} />
      {loading ? <div className="panel" style={{ padding: 16 }}>Loading projects...</div> : null}
      {error ? (
        <div className="panel" style={{ padding: 16, borderColor: "#fecdd3", color: "var(--danger)" }}>
          {error}
        </div>
      ) : null}
      {!loading && !error ? <ProjectsList projects={projects} /> : null}
    </section>
  );
}
