import { expect, test, type Page } from "@playwright/test";

async function addMember(page: Page, name: string, salary: string, cost: string) {
  await page.getByRole("button", { name: "Add member" }).click();
  await page.getByLabel("Member name").last().fill(name);
  await page.getByLabel("Monthly salary").last().fill(salary);
  await page.getByLabel("Hourly cost").last().fill(cost);
}

async function addTask(page: Page, name: string, assignee: string, planned: string, actual: string) {
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByLabel("Task name").last().fill(name);
  await page.getByLabel("Assignee").last().selectOption({ label: assignee });
  await page.getByLabel("Planned hours").last().fill(planned);
  await page.getByLabel("Actual hours").last().fill(actual);
}

const stat = (page: Page, label: string) =>
  page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) }).locator("dd").first();

test("estimates a SOW and splits the overprofit", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Project Bonus/ }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page).toHaveURL(/\/bonus\/.+/);

  await page.getByLabel("Project name").fill("Website relaunch");
  await page.getByLabel("Client hourly rate").fill("100");

  await addMember(page, "Alice", "500", "40");
  await addMember(page, "Bob", "2000", "30");
  await addTask(page, "Frontend", "Alice", "100", "80");
  await addTask(page, "Backend", "Bob", "50", "60");

  await expect(stat(page, "SOW price")).toHaveText("€15,000.00");
  await expect(stat(page, "Overprofit")).toHaveText("€500.00");
  await expect(stat(page, "Team pool (50%)")).toHaveText("€250.00");

  const rows = page.getByRole("table", { name: "Bonus per member" }).getByRole("row");
  // Alice: whole pool (Bob overran), capped at 50% of €500 salary = €250
  await expect(rows.filter({ hasText: "Alice" })).toContainText("€250.00");
  await expect(rows.filter({ hasText: "Bob" })).toContainText("(+10 h)");
  await expect(rows.filter({ hasText: "Bob" }).locator("td").last()).toHaveText("€0.00");

  // persisted in the browser
  await page.reload();
  await expect(page.getByLabel("Project name")).toHaveValue("Website relaunch");
  await expect(stat(page, "Company total")).toHaveText("€250.00");

  await page.getByRole("link", { name: "← Projects" }).click();
  await expect(page.getByRole("link", { name: /Website relaunch/ })).toBeVisible();
});

test("imports an exported project file", async ({ page }) => {
  await page.goto("/bonus");
  const file = {
    app: "business-core/bonus",
    version: 1,
    projects: [
      {
        id: "imported-1",
        name: "Imported project",
        client: "ACME",
        currency: "EUR",
        hourlyRate: 50,
        teamSharePct: 50,
        bonusCapPct: 50,
        members: [],
        tasks: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
  await page.getByTestId("import-input").setInputFiles({
    name: "export.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.getByRole("status")).toHaveText("Imported 1 project.");
  await expect(page.getByRole("link", { name: /Imported project/ })).toBeVisible();
});
