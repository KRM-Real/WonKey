"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

type Props = {
  projects: Project[];
};

export function ProjectsList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900">No projects yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Create your first project to start issuing keys and tracking requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <FolderKanban className="h-5 w-5" />
              </div>
              <Badge variant="blue">Project</Badge>
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-900">{project.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Org {project.org_id.slice(0, 8)}... · {formatDate(project.created_at)}
              </p>
            </div>
            <Link className={buttonVariants({ variant: "secondary" })} href={`/projects/${project.id}?tab=analytics`}>
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
