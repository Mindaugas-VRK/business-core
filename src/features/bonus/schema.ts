import { z } from "zod";

const money = z.number().finite().min(0);
const hours = z.number().finite().min(0);
const percent = z.number().finite().min(0).max(100);

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  /** Gross monthly salary. The personal bonus cap is a percentage of this. */
  monthlySalary: money,
  /** Fully loaded internal cost of one hour of this person's work. */
  hourlyCost: money,
});

export const taskSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  memberId: z.string(),
  plannedHours: hours,
  /** `null` until the hours are reported; treated as equal to planned. */
  actualHours: hours.nullable(),
});

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  client: z.string(),
  currency: z.string().length(3),
  /** Hourly rate the client is billed in the SOW. */
  hourlyRate: money,
  /** Share of the overprofit that goes to the delivery team. */
  teamSharePct: percent,
  /** Personal bonus cap as a share of monthly salary. */
  bonusCapPct: percent,
  members: z.array(memberSchema),
  tasks: z.array(taskSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const exportFileSchema = z.object({
  app: z.literal("business-core/bonus"),
  version: z.literal(1),
  projects: z.array(projectSchema),
});

export type Member = z.infer<typeof memberSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ExportFile = z.infer<typeof exportFileSchema>;

export const DEFAULT_TEAM_SHARE_PCT = 50;
export const DEFAULT_BONUS_CAP_PCT = 50;

export function newProject(name: string, now = new Date()): Project {
  const timestamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    client: "",
    currency: "EUR",
    hourlyRate: 0,
    teamSharePct: DEFAULT_TEAM_SHARE_PCT,
    bonusCapPct: DEFAULT_BONUS_CAP_PCT,
    members: [],
    tasks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
