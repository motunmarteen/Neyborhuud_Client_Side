# API Registry — Analytics

> Mount: `app.use("/api/v1/analytics", analyticsRoutes)` — `app.ts:327`
> Source: `NeyborHuud-ServerSide/src/modules/analytics/analytics.routes.ts`
>
> **Total: 2 routes.** Both `protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Handler |
|---|---|---|
| POST | `/track` | `trackEvent` |
| GET | `/stats` | `getStats` |

## Known issues found while building this registry

- None. Generic event-tracking primitive. `safety.md`'s finding about a removed legacy analytics
  endpoint with a cross-user data-leak bug was in a *different* module (safety), not this one —
  worth double-checking this module's `getStats` doesn't have a similar per-user scoping gap, but
  not traced into the controller this pass.
