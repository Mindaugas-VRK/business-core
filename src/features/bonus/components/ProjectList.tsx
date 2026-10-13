"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/fields";
import { downloadJson, formatMoney } from "@/lib/format";
import { calculateBonus } from "../calculate";
import { newProject } from "../schema";
import { importProjects, saveProject, toExportFile, useProjects } from "../store";

export function ProjectList() {
  const projects = useProjects();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (projects === null) return <p className="text-sm text-zinc-500">Loading…</p>;

  const create = () => {
    const project = newProject(`Project ${projects.length + 1}`);
    saveProject(project);
    router.push(`/bonus/${project.id}`);
  };

  const onImport = async (file: File) => {
    try {
      const count = importProjects(await file.text());
      setMessage(`Imported ${count} project${count === 1 ? "" : "s"}.`);
    } catch {
      setMessage("That file is not a valid Project Bonus export.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">Project Bonus</h1>
        <Button onClick={() => fileInput.current?.click()}>Import</Button>
        <Button
          disabled={projects.length === 0}
          onClick={() => downloadJson("bonus-projects.json", toExportFile(projects))}
        >
          Export all
        </Button>
        <Button variant="primary" onClick={create}>
          New project
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = "";
          }}
        />
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}

      {projects.length === 0 ? (
        <p className="mt-10 text-center text-zinc-500">
          No projects yet. Create one to estimate a SOW and calculate bonuses.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {projects.map((p) => {
            const r = calculateBonus(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/bonus/${p.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <span className="mr-auto">
                    <span className="font-medium">{p.name || "Untitled"}</span>
                    {p.client && <span className="ml-2 text-sm text-zinc-500">{p.client}</span>}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    SOW {formatMoney(r.priceCents, p.currency)}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Team bonus {formatMoney(r.paidToTeamCents, p.currency)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
