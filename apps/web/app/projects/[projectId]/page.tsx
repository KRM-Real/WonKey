import { TopNav } from "@/components/top-nav";
import { ProjectDetailClient } from "./project-detail-client";

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function normalizeTab(tab: string | undefined): "keys" | "limits" | "logs" | "analytics" {
  if (tab === "limits" || tab === "logs" || tab === "analytics") {
    return tab;
  }
  return "keys";
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const query = await searchParams;
  const tab = normalizeTab(query.tab);

  return (
    <>
      <TopNav />
      <main>
        <ProjectDetailClient projectId={projectId} tab={tab} />
      </main>
    </>
  );
}
