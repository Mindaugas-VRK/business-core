import type { Project } from "./schema";

/**
 * Bonus model
 *
 *   SOW price        = Σ planned hours × client hourly rate
 *   planned profit   = price − Σ planned hours × member hourly cost
 *   actual profit    = price − Σ actual hours  × member hourly cost
 *   overprofit       = actual profit − planned profit   (only if > 0)
 *   team pool        = overprofit × team share %          (default 50%)
 *   org share        = overprofit − team pool
 *
 * The team pool is split by hours saved (planned − actual, summed per person).
 * A person who used as many or more hours than planned gets nothing. Each
 * person's bonus is capped at `bonusCapPct` of their monthly salary; whatever
 * the caps (or rounding) leave in the pool is returned to the organisation.
 *
 * All money is computed in integer cents and hours in hundredths, so totals
 * always add up exactly.
 */

export type MemberResult = {
  memberId: string;
  name: string;
  plannedHours: number;
  actualHours: number;
  hoursSaved: number;
  overrunHours: number;
  /** Share of the team pool before the salary cap. */
  uncappedCents: number;
  capCents: number;
  bonusCents: number;
  capped: boolean;
};

export type BonusResult = {
  priceCents: number;
  plannedCostCents: number;
  actualCostCents: number;
  plannedProfitCents: number;
  actualProfitCents: number;
  /** Can be negative when the team used more hours than planned. */
  overprofitCents: number;
  teamPoolCents: number;
  paidToTeamCents: number;
  /** Team pool money not paid out because of caps or rounding. */
  returnedToOrgCents: number;
  orgTotalCents: number;
  members: MemberResult[];
  /** Tasks whose actual hours have not been reported yet. */
  pendingTasks: number;
  warnings: string[];
};

const toCents = (amount: number) => Math.round(amount * 100);
const toHundredths = (hours: number) => Math.round(hours * 100);
/** hundredths of an hour × cents per hour → cents */
const cost = (hoursH: number, rateCents: number) => Math.round((hoursH * rateCents) / 100);

export function calculateBonus(project: Project): BonusResult {
  const warnings: string[] = [];
  const rateCents = toCents(project.hourlyRate);

  const perMember = new Map(
    project.members.map((m) => [m.id, { member: m, plannedH: 0, actualH: 0 }]),
  );

  let plannedH = 0;
  let plannedCostCents = 0;
  let actualCostCents = 0;
  let pendingTasks = 0;

  for (const task of project.tasks) {
    const tPlannedH = toHundredths(task.plannedHours);
    const tActualH = task.actualHours === null ? tPlannedH : toHundredths(task.actualHours);
    if (task.actualHours === null) pendingTasks++;
    plannedH += tPlannedH;

    const entry = perMember.get(task.memberId);
    if (!entry) {
      warnings.push(`Task "${task.name || "Untitled"}" has no assignee and is excluded from costs.`);
      continue;
    }
    const hourlyCostCents = toCents(entry.member.hourlyCost);
    plannedCostCents += cost(tPlannedH, hourlyCostCents);
    actualCostCents += cost(tActualH, hourlyCostCents);
    entry.plannedH += tPlannedH;
    entry.actualH += tActualH;
  }

  const priceCents = cost(plannedH, rateCents);
  const plannedProfitCents = priceCents - plannedCostCents;
  const actualProfitCents = priceCents - actualCostCents;
  const overprofitCents = actualProfitCents - plannedProfitCents;
  const teamPoolCents =
    overprofitCents > 0 ? Math.floor((overprofitCents * project.teamSharePct) / 100) : 0;

  const rows = [...perMember.values()].map(({ member, plannedH, actualH }) => ({
    member,
    plannedH,
    actualH,
    savedH: Math.max(0, plannedH - actualH),
  }));
  const totalSavedH = rows.reduce((sum, r) => sum + r.savedH, 0);

  const members: MemberResult[] = rows.map(({ member, plannedH, actualH, savedH }) => {
    const uncappedCents =
      totalSavedH > 0 ? Math.floor((teamPoolCents * savedH) / totalSavedH) : 0;
    const capCents = Math.floor((toCents(member.monthlySalary) * project.bonusCapPct) / 100);
    const bonusCents = Math.min(uncappedCents, capCents);
    return {
      memberId: member.id,
      name: member.name,
      plannedHours: plannedH / 100,
      actualHours: actualH / 100,
      hoursSaved: savedH / 100,
      overrunHours: Math.max(0, actualH - plannedH) / 100,
      uncappedCents,
      capCents,
      bonusCents,
      capped: uncappedCents > capCents,
    };
  });

  const paidToTeamCents = members.reduce((sum, m) => sum + m.bonusCents, 0);
  const returnedToOrgCents = teamPoolCents - paidToTeamCents;
  const orgTotalCents = Math.max(0, overprofitCents) - paidToTeamCents;

  if (rateCents === 0 && plannedH > 0) warnings.push("Client hourly rate is 0.");

  return {
    priceCents,
    plannedCostCents,
    actualCostCents,
    plannedProfitCents,
    actualProfitCents,
    overprofitCents,
    teamPoolCents,
    paidToTeamCents,
    returnedToOrgCents,
    orgTotalCents,
    members,
    pendingTasks,
    warnings,
  };
}
