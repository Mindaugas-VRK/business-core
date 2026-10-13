import { describe, expect, it } from "vitest";
import { calculateBonus } from "./calculate";
import type { Member, Project, Task } from "./schema";

const member = (id: string, monthlySalary: number, hourlyCost: number): Member => ({
  id,
  name: id,
  monthlySalary,
  hourlyCost,
});

const task = (memberId: string, plannedHours: number, actualHours: number | null): Task => ({
  id: crypto.randomUUID(),
  name: `${memberId} task`,
  memberId,
  plannedHours,
  actualHours,
});

const project = (overrides: Partial<Project>): Project => ({
  id: "p1",
  name: "Test",
  client: "",
  currency: "EUR",
  hourlyRate: 100,
  teamSharePct: 50,
  bonusCapPct: 50,
  members: [member("alice", 3000, 40), member("bob", 2000, 30)],
  tasks: [],
  createdAt: "",
  updatedAt: "",
  ...overrides,
});

const bonusOf = (result: ReturnType<typeof calculateBonus>, id: string) =>
  result.members.find((m) => m.memberId === id)!;

describe("calculateBonus", () => {
  it("computes price, profit and overprofit from planned vs actual hours", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 100, 80), task("bob", 50, 50)] }));

    expect(r.priceCents).toBe(15_000_00); // 150 h × 100
    expect(r.plannedCostCents).toBe(5_500_00); // 100×40 + 50×30
    expect(r.actualCostCents).toBe(4_700_00); // 80×40 + 50×30
    expect(r.plannedProfitCents).toBe(9_500_00);
    expect(r.actualProfitCents).toBe(10_300_00);
    expect(r.overprofitCents).toBe(800_00);
  });

  it("splits overprofit 50/50 between team and organisation", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 100, 80), task("bob", 50, 50)] }));

    expect(r.teamPoolCents).toBe(400_00);
    expect(bonusOf(r, "alice").bonusCents).toBe(400_00);
    expect(bonusOf(r, "bob").bonusCents).toBe(0);
    expect(r.orgTotalCents).toBe(400_00);
    expect(r.paidToTeamCents + r.orgTotalCents).toBe(r.overprofitCents);
  });

  it("respects a custom team share", () => {
    const r = calculateBonus(project({ teamSharePct: 30, tasks: [task("alice", 100, 80)] }));
    expect(r.teamPoolCents).toBe(240_00); // 30% of 800
    expect(r.orgTotalCents).toBe(560_00);
  });

  it("splits the team pool by hours saved, not by cost", () => {
    // alice saves 20 h × 40 = 800, bob saves 10 h × 30 = 300 → overprofit 1100, pool 550
    const r = calculateBonus(project({ tasks: [task("alice", 100, 80), task("bob", 50, 40)] }));

    expect(r.teamPoolCents).toBe(550_00);
    expect(bonusOf(r, "alice").hoursSaved).toBe(20);
    expect(bonusOf(r, "bob").hoursSaved).toBe(10);
    expect(bonusOf(r, "alice").bonusCents).toBe(366_66); // 2/3, rounded down
    expect(bonusOf(r, "bob").bonusCents).toBe(183_33); // 1/3, rounded down
    expect(r.returnedToOrgCents).toBe(1); // rounding remainder
    expect(r.paidToTeamCents + r.orgTotalCents).toBe(r.overprofitCents);
  });

  it("caps a bonus at the given % of monthly salary and returns the rest to the org", () => {
    const r = calculateBonus(
      project({
        members: [member("alice", 500, 40), member("bob", 2000, 30)],
        tasks: [task("alice", 100, 80)],
      }),
    );

    const alice = bonusOf(r, "alice");
    expect(alice.uncappedCents).toBe(400_00);
    expect(alice.capCents).toBe(250_00); // 50% of 500
    expect(alice.bonusCents).toBe(250_00);
    expect(alice.capped).toBe(true);
    expect(r.returnedToOrgCents).toBe(150_00);
    expect(r.orgTotalCents).toBe(550_00);
  });

  it("does not redistribute capped money to other team members", () => {
    const r = calculateBonus(
      project({
        members: [member("alice", 100, 40), member("bob", 100_000, 40)],
        tasks: [task("alice", 100, 90), task("bob", 100, 90)], // pool 400, 200 each
      }),
    );

    expect(bonusOf(r, "alice").bonusCents).toBe(50_00);
    expect(bonusOf(r, "bob").bonusCents).toBe(200_00);
    expect(r.returnedToOrgCents).toBe(150_00);
  });

  it("gives nothing to someone who overran, and the overrun lowers the overprofit", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 100, 80), task("bob", 50, 60)] }));

    expect(r.overprofitCents).toBe(500_00); // 800 saved − 300 overrun
    expect(r.teamPoolCents).toBe(250_00);
    expect(bonusOf(r, "bob").overrunHours).toBe(10);
    expect(bonusOf(r, "bob").bonusCents).toBe(0);
    expect(bonusOf(r, "alice").bonusCents).toBe(250_00);
  });

  it("pays no bonus when the project overran overall", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 100, 120), task("bob", 50, 45)] }));

    expect(r.overprofitCents).toBe(-650_00);
    expect(r.teamPoolCents).toBe(0);
    expect(r.paidToTeamCents).toBe(0);
    expect(r.orgTotalCents).toBe(0);
    expect(bonusOf(r, "bob").bonusCents).toBe(0);
  });

  it("nets savings and overruns across one person's tasks", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 50, 40), task("alice", 50, 55)] }));
    expect(bonusOf(r, "alice").hoursSaved).toBe(5);
    expect(bonusOf(r, "alice").overrunHours).toBe(0);
  });

  it("treats unreported actual hours as planned and counts them as pending", () => {
    const r = calculateBonus(project({ tasks: [task("alice", 100, null), task("bob", 50, 50)] }));
    expect(r.pendingTasks).toBe(1);
    expect(r.overprofitCents).toBe(0);
  });

  it("handles fractional hours and rates exactly", () => {
    const r = calculateBonus(
      project({
        hourlyRate: 87.5,
        members: [member("alice", 3000, 33.33)],
        tasks: [task("alice", 7.5, 6.25)],
      }),
    );
    expect(r.priceCents).toBe(656_25);
    expect(r.overprofitCents).toBe(r.plannedCostCents - r.actualCostCents);
    // costs are rounded to cents first (249.98 − 208.31), so the shown figures always reconcile
    expect(r.overprofitCents).toBe(41_67);
  });

  it("warns about tasks without a valid assignee", () => {
    const r = calculateBonus(project({ tasks: [task("ghost", 10, 5)] }));
    expect(r.warnings).toHaveLength(1);
    expect(r.overprofitCents).toBe(0);
  });

  it("returns zeros for an empty project", () => {
    const r = calculateBonus(project({ members: [], tasks: [] }));
    expect(r).toMatchObject({ priceCents: 0, overprofitCents: 0, teamPoolCents: 0, members: [] });
  });
});
