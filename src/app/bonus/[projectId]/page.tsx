import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectEditor } from "@/features/bonus/components/ProjectEditor";

export const metadata: Metadata = { title: "Project Bonus" };

export default function Page({ params }: PageProps<"/bonus/[projectId]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      {params.then(({ projectId }) => (
        <ProjectEditor projectId={projectId} />
      ))}
    </Suspense>
  );
}
