"use client";

import Link from "next/link";
import { Project } from "@/lib/types";

type Props = {
  projects: Project[];
};

export function ProjectsList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h3 style={{ marginTop: 0 }}>No projects yet</h3>
        <p className="muted" style={{ marginBottom: 0 }}>
          Create your first project to start issuing keys and tracking requests.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
      {projects.map((project) => (
        <article key={project.id} className="card soft-shadow" style={{ padding: 16, display: "grid", gap: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 22 }}>{project.name}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Org {project.org_id.slice(0, 8)}... | {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="split-row">
            <span className="badge">Project</span>
            <Link className="button button-soft" href={`/projects/${project.id}?tab=keys`}>
              Open dashboard
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
