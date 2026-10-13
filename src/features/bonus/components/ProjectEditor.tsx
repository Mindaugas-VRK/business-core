"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button, inputClass, NumberField } from "@/components/fields";
import { Section, Td, Th } from "@/components/ui";
import { downloadJson, formatHours, slugify } from "@/lib/format";
import { calculateBonus } from "../calculate";
import type { Member, Project, Task } from "../schema";
import { deleteProject, saveProject, toExportFile, useProjects } from "../store";
import { ResultsPanel } from "./ResultsPanel";

const CURRENCIES = ["EUR", "USD", "GBP"];

export function ProjectEditor({ projectId }: { projectId: string }) {
  const projects = useProjects();
  const router = useRouter();

  if (projects === null) return <p className="text-sm text-zinc-500">Loading…</p>;
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <p>
        Project not found.{" "}
        <Link href="/bonus" className="text-indigo-600 underline">
          Back to projects
        </Link>
      </p>
    );
  }

  const update = (patch: Partial<Project>) => saveProject({ ...project, ...patch });
  const updateMember = (id: string, patch: Partial<Member>) =>
    update({ members: project.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const updateTask = (id: string, patch: Partial<Task>) =>
    update({ tasks: project.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const removeMember = (member: Member) => {
    const taskCount = project.tasks.filter((t) => t.memberId === member.id).length;
    if (
      taskCount > 0 &&
      !confirm(`Remove ${member.name || "this member"} and their ${taskCount} task(s)?`)
    )
      return;
    update({
      members: project.members.filter((m) => m.id !== member.id),
      tasks: project.tasks.filter((t) => t.memberId !== member.id),
    });
  };

  const result = calculateBonus(project);
  const plannedTotal = project.tasks.reduce((s, t) => s + t.plannedHours, 0);
  const actualTotal = project.tasks.reduce((s, t) => s + (t.actualHours ?? t.plannedHours), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/bonus" className="mr-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← Projects
        </Link>
        <input
          aria-label="Project name"
          className="mr-auto min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none"
          value={project.name}
          placeholder="Project name"
          onChange={(e) => update({ name: e.target.value })}
        />
        <Button
          onClick={() =>
            downloadJson(`bonus-${slugify(project.name)}.json`, toExportFile([project]))
          }
        >
          Export
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!confirm(`Delete "${project.name}"?`)) return;
            deleteProject(project.id);
            router.push("/bonus");
          }}
        >
          Delete
        </Button>
      </div>

      <Section title="SOW settings">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Label text="Client">
            <input
              className={inputClass}
              value={project.client}
              onChange={(e) => update({ client: e.target.value })}
            />
          </Label>
          <Label text="Currency">
            <select
              className={inputClass}
              value={project.currency}
              onChange={(e) => update({ currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Label>
          <Label text="Client hourly rate">
            <NumberField
              value={project.hourlyRate}
              onChange={(v) => update({ hourlyRate: v ?? 0 })}
            />
          </Label>
          <Label text="Team share of overprofit, %">
            <NumberField
              max={100}
              value={project.teamSharePct}
              onChange={(v) => update({ teamSharePct: Math.min(100, v ?? 0) })}
            />
          </Label>
          <Label text="Bonus cap, % of monthly salary">
            <NumberField
              max={100}
              value={project.bonusCapPct}
              onChange={(v) => update({ bonusCapPct: Math.min(100, v ?? 0) })}
            />
          </Label>
        </div>
      </Section>

      <Section
        title="Team"
        action={
          <Button
            onClick={() =>
              update({
                members: [
                  ...project.members,
                  { id: crypto.randomUUID(), name: "", monthlySalary: 0, hourlyCost: 0 },
                ],
              })
            }
          >
            Add member
          </Button>
        }
      >
        {project.members.length === 0 ? (
          <Empty>Add the people who deliver this project.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <Th>Name</Th>
                <Th className="w-40 text-right">Monthly salary</Th>
                <Th className="w-40 text-right">Hourly cost</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {project.members.map((m) => (
                <tr key={m.id}>
                  <Td>
                    <input
                      aria-label="Member name"
                      className={inputClass}
                      value={m.name}
                      placeholder="Full name"
                      onChange={(e) => updateMember(m.id, { name: e.target.value })}
                    />
                  </Td>
                  <Td>
                    <NumberField
                      aria-label="Monthly salary"
                      value={m.monthlySalary}
                      onChange={(v) => updateMember(m.id, { monthlySalary: v ?? 0 })}
                    />
                  </Td>
                  <Td>
                    <NumberField
                      aria-label="Hourly cost"
                      value={m.hourlyCost}
                      onChange={(v) => updateMember(m.id, { hourlyCost: v ?? 0 })}
                    />
                  </Td>
                  <Td>
                    <Button variant="danger" aria-label="Remove member" onClick={() => removeMember(m)}>
                      ✕
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="Tasks (SOW)"
        action={
          <Button
            disabled={project.members.length === 0}
            title={project.members.length === 0 ? "Add a team member first" : undefined}
            onClick={() =>
              update({
                tasks: [
                  ...project.tasks,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    memberId: project.members[0].id,
                    plannedHours: 0,
                    actualHours: null,
                  },
                ],
              })
            }
          >
            Add task
          </Button>
        }
      >
        {project.tasks.length === 0 ? (
          <Empty>List the SOW tasks with their planned hours.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <Th>Task</Th>
                <Th className="w-48">Assignee</Th>
                <Th className="w-28 text-right">Planned h</Th>
                <Th className="w-28 text-right">Actual h</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {project.tasks.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <input
                      aria-label="Task name"
                      className={inputClass}
                      value={t.name}
                      placeholder="Task"
                      onChange={(e) => updateTask(t.id, { name: e.target.value })}
                    />
                  </Td>
                  <Td>
                    <select
                      aria-label="Assignee"
                      className={inputClass}
                      value={t.memberId}
                      onChange={(e) => updateTask(t.id, { memberId: e.target.value })}
                    >
                      {project.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || "Unnamed"}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <NumberField
                      aria-label="Planned hours"
                      value={t.plannedHours}
                      onChange={(v) => updateTask(t.id, { plannedHours: v ?? 0 })}
                    />
                  </Td>
                  <Td>
                    <NumberField
                      aria-label="Actual hours"
                      placeholder="—"
                      value={t.actualHours}
                      onChange={(v) => updateTask(t.id, { actualHours: v })}
                    />
                  </Td>
                  <Td>
                    <Button
                      variant="danger"
                      aria-label="Remove task"
                      onClick={() => update({ tasks: project.tasks.filter((x) => x.id !== t.id) })}
                    >
                      ✕
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <Td colSpan={2}>Total</Td>
                <Td className="text-right tabular-nums">{formatHours(plannedTotal)}</Td>
                <Td className="text-right tabular-nums">{formatHours(actualTotal)}</Td>
                <Td />
              </tr>
            </tfoot>
          </table>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Leave actual hours empty until they are reported; they count as planned meanwhile.
        </p>
      </Section>

      <ResultsPanel result={result} project={project} />
    </div>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-zinc-600 dark:text-zinc-400">{text}</span>
      {children}
    </label>
  );
}

const Empty = ({ children }: { children: ReactNode }) => (
  <p className="py-4 text-center text-sm text-zinc-500">{children}</p>
);
