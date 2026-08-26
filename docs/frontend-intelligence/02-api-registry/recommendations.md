# API Registry — Recommendations

> Mount: `app.use("/api/v1/recommendations", recommendationRoutes)` — `app.ts:329`
> Source: `NeyborHuud-ServerSide/src/modules/recommendations/recommendation.routes.ts`
>
> **Total: 2 routes.** Both `protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/` | `getRecommendations` | |
| POST | `/refresh-segments` | `refreshSegments` | Likely an internal/admin trigger for a recommendation-segmentation job rather than a normal end-user action — not confirmed via controller this pass |

## Known issues found while building this registry

- `refresh-segments` reads like an internal/cron-triggered or admin action rather than something
  the frontend would call directly from a user-facing screen — worth a controller-level check
  before assuming the rebuild needs to wire a UI trigger for it.
