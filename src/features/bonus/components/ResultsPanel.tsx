import { formatHours, formatMoney, formatPercent } from "@/lib/format";
import type { BonusResult } from "../calculate";
import type { Project } from "../schema";
import { Section, Td, Th } from "@/components/ui";

export function ResultsPanel({ result: r, project }: { result: BonusResult; project: Project }) {
  const money = (cents: number) => formatMoney(cents, project.currency);
  const margin = (profit: number) => (r.priceCents > 0 ? formatPercent(profit / r.priceCents) : "—");

  return (
    <Section title="Results">
      {(r.pendingTasks > 0 || r.warnings.length > 0) && (
        <ul className="mb-4 space-y-1 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {r.pendingTasks > 0 && (
            <li>
              {r.pendingTasks} task(s) have no actual hours yet — results are provisional.
            </li>
          )}
          {r.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="SOW price" value={money(r.priceCents)} />
        <Stat
          label="Planned profit"
          value={money(r.plannedProfitCents)}
          hint={`margin ${margin(r.plannedProfitCents)}`}
        />
        <Stat
          label="Actual profit"
          value={money(r.actualProfitCents)}
          hint={`margin ${margin(r.actualProfitCents)}`}
        />
        <Stat
          label={r.overprofitCents < 0 ? "Overrun (loss vs plan)" : "Overprofit"}
          value={money(r.overprofitCents)}
          tone={r.overprofitCents < 0 ? "bad" : r.overprofitCents > 0 ? "good" : undefined}
        />
        <Stat
          label={`Team pool (${project.teamSharePct}%)`}
          value={money(r.teamPoolCents)}
        />
        <Stat label="Paid to team" value={money(r.paidToTeamCents)} tone="good" />
        <Stat
          label="Returned to company"
          value={money(r.returnedToOrgCents)}
          hint="unpaid due to salary caps / rounding"
        />
        <Stat label="Company total" value={money(r.orgTotalCents)} />
      </dl>

      {r.members.length > 0 && (
        <table className="mt-6 w-full text-sm" aria-label="Bonus per member">
          <thead>
            <tr className="text-left text-zinc-500">
              <Th>Member</Th>
              <Th className="text-right">Planned</Th>
              <Th className="text-right">Actual</Th>
              <Th className="text-right">Saved</Th>
              <Th className="text-right">Share</Th>
              <Th className="text-right">Cap</Th>
              <Th className="text-right">Bonus</Th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {r.members.map((m) => (
              <tr key={m.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td>{m.name || "Unnamed"}</Td>
                <Td className="text-right">{formatHours(m.plannedHours)}</Td>
                <Td className="text-right">
                  {formatHours(m.actualHours)}
                  {m.overrunHours > 0 && (
                    <span className="ml-1 text-red-600 dark:text-red-400">
                      (+{formatHours(m.overrunHours)})
                    </span>
                  )}
                </Td>
                <Td className="text-right">{formatHours(m.hoursSaved)}</Td>
                <Td className="text-right">{money(m.uncappedCents)}</Td>
                <Td className="text-right">{money(m.capCents)}</Td>
                <Td className="text-right font-semibold">
                  {money(m.bonusCents)}
                  {m.capped && <span className="ml-1 text-xs font-normal text-amber-600">capped</span>}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
        ? "text-red-600 dark:text-red-400"
        : "";
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${color}`}>{value}</dd>
      {hint && <dd className="text-xs text-zinc-500">{hint}</dd>}
    </div>
  );
}
