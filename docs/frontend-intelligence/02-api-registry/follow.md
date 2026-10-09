# API Registry — Follow / Block

> Mount: `app.use("/api/v1/follow", followRoutes)` — `app.ts:344`
> Source: `NeyborHuud-ServerSide/src/modules/follow/follow.routes.ts`
>
> **Total: 10 routes.** Mixed public/`protect` (Bearer-only — see `_auth-middleware-split.md`).
> Static path (`/milestones/me`) correctly ordered before `/:userId` per source comment.

## Follow
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/milestones/me` | `protect` | `getMyMilestoneStatus` |
| POST | `/:userId` | `protect` | `followUser` |
| DELETE | `/:userId` | `protect` | `unfollowUser` |
| GET | `/status/:userId` | `protect` | `getFollowStatus` |
| GET | `/counts/:userId` | public | `getFollowCounts` |
| GET | `/:userId/followers` | public | `getFollowers` |
| GET | `/:userId/following` | public | `getFollowing` |

## Block (shares this mount — separate controller, `block.controller.ts`)
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/block/:userId` | `protect` | `blockUser` |
| DELETE | `/block/:userId` | `protect` | `unblockUser` |
| GET | `/blocked` | `protect` | `getBlockedUsers` |
| GET | `/block/status/:userId` | `protect` | `getBlockStatus` |

## Known issues found while building this registry

- Confirms `connections.md`'s earlier note: **Follow is a real, separate one-directional
  relationship system**, distinct from Connections (mutual request/accept) and geo's Neighbors
  (passive, location-derived). Three genuinely different relationship primitives in this backend.
- Block/unblock sharing this mount rather than living under `safety.md` (where a "block" feature
  might be expected, alongside report/safety tooling) is a mild surprise worth remembering for the
  page/feature-mapping step — a "Blocked users" settings screen will call `/follow/blocked`, not
  something under `/safety`.
- `getMyMilestoneStatus`'s cast to `unknown as RequestHandler` (also applied to every other handler
  in this file) suggests a TypeScript typing mismatch was worked around rather than fixed — not a
  runtime concern, but a code-quality note if a backend cleanup pass happens alongside the frontend
  rebuild.
