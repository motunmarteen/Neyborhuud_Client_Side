# API Registry — Stats

> Mount: `app.use("/api/v1/stats", statsRoutes)` — `app.ts:351`
> Source: `NeyborHuud-ServerSide/src/modules/stats/stats.routes.ts`
>
> **Total: 1 route.** Public — source comment: "publicly accessible for the landing page social
> proof widget."

| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/public` | public | `getPublicStats` |

## Known issues found while building this registry

- None. Confirms a real "social proof" widget (user counts, etc.) exists or is intended for the
  marketing/landing page — relevant for the `(marketing)` route group identified in Step 1.
