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
          Create one project to start issuing API keys.
        </p>
      </div>
    );
  }

  return (
    <div className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Org</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>
                <code>{project.org_id.slice(0, 8)}...</code>
              </td>
              <td>{new Date(project.created_at).toLocaleString()}</td>
              <td>
                <Link className="button button-soft" href={`/projects/${project.id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
