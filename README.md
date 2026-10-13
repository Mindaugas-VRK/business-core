# Business Core

Internal business apps in one place. The home screen is a launcher ("folder") of
modules; each module lives in `src/features/<module>` and is registered in
`src/modules/registry.ts`.

## Modules

### Project Bonus (`/bonus`)

Estimates a project SOW and calculates the delivery team's bonus from overprofit.

| Step | Formula |
| --- | --- |
| SOW price | Σ planned task hours × client hourly rate |
| Planned profit | price − Σ planned hours × member hourly cost |
| Actual profit | price − Σ actual hours × member hourly cost |
| Overprofit | actual profit − planned profit (bonus only when > 0) |
| Team pool | overprofit × team share (default **50%**); the rest goes to the company |

Team pool distribution:

- Split by **hours saved** per person (planned − actual, netted across their tasks).
- A person who used as many or more hours than planned gets **0** (their overrun already lowers the overprofit).
- Each bonus is capped at **X% of monthly salary** (default 50%).
- Money not paid out because of caps (or cent rounding) is **returned to the company**, not redistributed.
- Tasks without reported actual hours count as planned and mark the result as provisional.

All money is calculated in integer cents. The logic is a pure function in
`src/features/bonus/calculate.ts`, covered by `calculate.test.ts`.

Data is stored in the browser (localStorage). Use **Export / Import** (JSON) to
back up or move projects between machines.

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright, builds the app first)
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zod, Vitest,
Testing Library, Playwright.
