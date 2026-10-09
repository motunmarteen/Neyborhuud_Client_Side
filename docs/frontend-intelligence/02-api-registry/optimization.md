# API Registry — Optimization (Data/Network Adaptation)

> Mount: `app.use("/api/v1/optimization", optimizationRoutes)` — `app.ts:334`
> Source: `NeyborHuud-ServerSide/src/modules/media/optimization.routes.ts` (lives under
> `modules/media/`, not its own top-level module directory)
>
> **Total: 4 routes.** Mixed public/`protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/ping` | public | `ping` | Source has a stale self-review comment ("Verify this is also in app.ts, maybe deduplicate") — checked directly, `app.ts` only has a *different* path, `/api/v1/health` (line 262); not a real duplicate, comment can be disregarded |
| GET | `/data-usage` | `protect` | `getDataUsage` | |
| POST | `/content-adapt` | `protect` | `adaptContent` | Likely adapts media/content quality for low-bandwidth connections, matching the module's "optimization" purpose — not traced into controller this pass |
| GET | `/network-quality` | public | `ping` | Same handler as `/ping`, per source comment "Reuse ping logic or enhance" — literally identical response today, not yet differentiated |

## Known issues found while building this registry

- **`/ping` and `/network-quality` are byte-for-byte the same route** (both call the `ping`
  handler) — source comment admits this is provisional ("Reuse ping logic or enhance"), not a bug,
  but the frontend should pick one canonical path rather than both.
- This module is clearly built for the PWA's low-bandwidth/data-saver use case (referenced in Step
  1's PWA Architecture section) — relevant context for the mobile app-store rebuild goal, since a
  native app has different network-adaptation needs/APIs than a PWA.
