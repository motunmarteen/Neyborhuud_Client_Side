# API Registry — FYI Bulletins

> Mount: `app.use("/api/v1/fyi", fyiRoutes)` — `app.ts:332`
> Source: `NeyborHuud-ServerSide/src/modules/content/fyi.routes.ts` (lives under `modules/content/`,
> same pattern as `gossip.md`)
>
> **Total: 10 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`) — **not**
> `protectWithBetterAuth`, so this module does not have gossip's broken-auth problem despite living
> in the same source directory.

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/` | `createBulletin` | `protect` + `requireVerified`, validated |
| GET | `/` | `getBulletins` | |
| PATCH | `/:id/status` | `updateBulletinStatus` | validated |
| POST | `/:id/pin` | `pinBulletin` | Comment: "community leaders" — not RBAC-enforced at the route level (no `restrictedTo`), unlike `moderation.md`; enforcement, if any, must be inside the controller |
| DELETE | `/:id/pin` | `unpinBulletin` | Same note |
| POST | `/:id/rsvp` | `rsvpToBulletin` | validated |
| POST | `/:id/receipt` | `confirmReceipt` | "Confirm receipt" of a bulletin — acknowledgment/read-receipt pattern |
| POST | `/:id/endorse` | `endorseBulletin` | Comment: "authorities" — same route-level RBAC caveat as pin/unpin |
| GET | `/:id/endorsements` | `getEndorsements` | |
| GET | `/:id/status-history` | `getStatusHistory` | Audit trail |

## Known issues found while building this registry

- **Two route comments claim role restriction ("community leaders," "authorities") that isn't
  enforced by route-level middleware** — unlike `moderation.routes.ts`, which uses an explicit
  `restrictedTo('Moderator', 'Super Admin')` gate, this file only applies `protect` (any
  authenticated user) to `/pin`, `/unpin`, and `/endorse`. Either the controller enforces role
  checks internally (not traced this pass) or these actions are currently callable by any logged-in
  user despite the comments suggesting otherwise. Worth a controller-level check before the
  rebuild designs UI that assumes only leaders/authorities can pin or endorse.
- "FYI Bulletins" appears to be a formal community-notice system (RSVP, receipt confirmation,
  authority endorsement, status audit trail) distinct from both casual Gossip/Huud Gist threads and
  Events — worth keeping as a clearly separate feature concept in the later product/feature-mapping
  step rather than merging its UI with either.
