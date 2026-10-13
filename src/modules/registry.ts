/**
 * Apps shown on the Business Core home screen. Add a module here and create
 * its route under `src/app/<href>`.
 */
export type AppModule = {
  id: string;
  name: string;
  description: string;
  href: string;
  /** Tailwind background class for the app icon tile. */
  color: string;
  initials: string;
};

export const modules: AppModule[] = [
  {
    id: "bonus",
    name: "Project Bonus",
    description: "SOW estimate, profit and overprofit split between delivery team and company.",
    href: "/bonus",
    color: "bg-indigo-600",
    initials: "PB",
  },
];
