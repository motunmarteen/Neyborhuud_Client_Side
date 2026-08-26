# API Registry — Admin

> Mount: `app.use("/api/v1/admin", adminRoutes)` — `app.ts:337`
> Source: `NeyborHuud-ServerSide/src/modules/admin/admin.routes.ts`
>
> **Total: 30 routes.** Almost entirely `protect` + `requireAdmin` (a **second, distinct RBAC gate**
> from `moderation.md`'s `restrictedTo`). Not a normal end-user surface — this is the platform's
> admin/ops console API.

> **Note on `protect` + `requireAdmin` correctness**: verified `requireAdmin`
> (`middlewares/admin.middleware.ts:10-26`) checks three signals — RBAC `userRoles` array, a legacy
> `role` field on the user document, and a legacy `isAdmin` flag. Also verified `protect`
> (`auth.middleware.ts:451-541`) *does* populate `req.userRoles` for Bearer-token requests (via
> `fetchUserRolesAndPermissions`), so — unlike `gossip.md`'s finding — **this combination works
> correctly for the frontend's Bearer-only auth model. No bug here.**

## Discovery / Ops (special-cased auth)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/discovery` | public | `getCapabilities` | |
| GET | `/ops/metrics` | public route, but source comment says gated by a static `METRICS_TOKEN` bearer check inside `metrics.controller.ts` when that env var is set | `getMetrics` | Prometheus scrape target — deliberately registered before `protect`/`requireAdmin` and before the audit-log middleware (a 15s-interval scraper would otherwise spam the audit log) |

## Dashboard
| Method | Path | Handler |
|---|---|---|
| GET | `/dashboard/stats` | `getSystemStats` |
| GET | `/dashboard/activity` | `getRecentActivity` |
| GET | `/dashboard/moderation` | `getModerationStats` |
| GET | `/ops/dashboard` | `getOpsDashboard` |

## Dead Letter Queue (DLQ) management
| Method | Path | Handler |
|---|---|---|
| GET | `/dlq` | `listDlqEvents` |
| GET | `/dlq/:id` | `getDlqEvent` |
| POST | `/dlq/:id/replay` | `replayDlqEvent` |
| PATCH | `/dlq/:id/resolve` | `resolveDlqEvent` |
| DELETE | `/dlq/:id` | `deleteDlqEvent` |

## Analytics
| Method | Path | Handler |
|---|---|---|
| GET | `/analytics` | `getAnalyticsSummary` |
| GET | `/analytics/growth` | `getUserGrowth` |
| GET | `/analytics/features` | `getFeatureUsage` |
| GET | `/analytics/economy` | `getEconomyStats` |
| GET | `/analytics/rankings` | `getCommunityRankings` |
| GET | `/audit-logs` | `viewAuditLogs` |

## User management
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/users` | `listUsers` | |
| GET | `/users/:userId/export` | `exportUserByAdmin` | |
| GET | `/users/:userId` | `getUserById` | |
| POST | `/users/:userId/ban` | `banUser` | |
| POST | `/users/:userId/suspend` | `suspendUser` | |
| POST | `/users/:userId/unsuspend` | `unsuspendUser` | |
| POST | `/users/:userId/verify` | `verifyUser` | **Admin manual override for identity verification** — see cross-reference below |
| POST | `/users/:userId/unverify` | `unverifyUser` | |
| PATCH | `/users/:userId/role` | `changeUserRole` | |
| DELETE | `/users/:userId` | `deleteUser` | |
| POST | `/users/purge-deleted` | `purgeDeletedUsers` | |

## Content moderation
| Method | Path | Handler |
|---|---|---|
| POST | `/content/delete` | `adminDeleteContent` |

## Reports
| Method | Path | Handler |
|---|---|---|
| GET | `/reports` | `listReports` |
| GET | `/reports/:reportId` | `getReport` |
| PATCH | `/reports/:reportId/status` | `updateReportStatus` |

## Community picker admin
| Method | Path | Handler |
|---|---|---|
| GET | `/picker-communities` | `listPickerCommunities` |
| PATCH | `/picker-communities/:id` | `patchPickerCommunity` |

## Known issues found while building this registry

- **This module effectively confirms `identity.md`'s fake-KYC finding matters operationally**:
  since `submitKYC` is a stub, `/users/:userId/verify` (this file) is presumably the *real* path by
  which any user actually becomes "Verified" today — a human admin manually flipping the flag,
  rather than the automated KYC flow completing. Worth confirming directly with whoever operates
  the platform whether this is the known/accepted current process.
- Two distinct RBAC gates now confirmed across the registry: `requireAdmin` (this file — checks
  `userRoles`/`role`/`isAdmin`, three separate signals) and `restrictedTo(...)` (`moderation.md` —
  checks specific named roles). Both work correctly with the frontend's Bearer-only auth, unlike
  `protectWithBetterAuth` in `gossip.md`. Worth unifying naming/approach in a later backend cleanup,
  not urgent for the frontend rebuild.
- Confirms Step 1's audit did not fully surface: there is a real, fairly complete internal ops
  console (DLQ replay, Prometheus metrics, audit logs, economy analytics) — worth knowing this
  exists even though it's out of scope for the consumer-facing app rebuild.
