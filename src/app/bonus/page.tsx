import type { Metadata } from "next";
import { ProjectList } from "@/features/bonus/components/ProjectList";

export const metadata: Metadata = { title: "Project Bonus" };

export default function Page() {
  return <ProjectList />;
}
