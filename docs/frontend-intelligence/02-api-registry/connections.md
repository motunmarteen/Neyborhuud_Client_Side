# API Registry — Connections

> Mount: `app.use("/api/v1/connections", connectionsRoutes)` — `app.ts:335`
> Source: `NeyborHuud-ServerSide/src/modules/connections/connections.routes.ts`
>
> **Total: 4 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/request` | `sendRequest` | |
| PUT | `/respond` | `respondToRequest` | |
| GET | `/` | `getConnections` | |
| GET | `/pending` | `getPendingRequests` | Source comment: "New pending requests" |

## Known issues found while building this registry

- A "Connection request" system (send/respond/list/pending) exists **separately from** the
  `follow.md` module (Follow/Unfollow, mounted at `/api/v1/follow`) and `geo.md`'s `/neighbors`
  (home-location-based discovery). Three distinct relationship concepts now confirmed in this
  backend: **Connections** (mutual, request/accept), **Follow** (one-directional, presumably
  Instagram-style), and **Neighbors** (passive, location-derived, no relationship state). The
  frontend rebuild's product/feature-mapping step needs to keep these three clearly distinct in the
  UI rather than conflating them into one "people" concept.
