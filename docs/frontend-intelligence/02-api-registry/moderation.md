# API Registry — Moderation

> Mount: `app.use("/api/v1/moderation", moderationRoutes)` — `app.ts:328`
> Source: `NeyborHuud-ServerSide/src/modules/moderation/moderation.routes.ts`
>
> **Total: 4 routes.** First module found using **router-level auth** (`router.use(protect)`) —
> every route in the file inherits it, rather than each route declaring `protect` individually.
>
> **New middleware not seen in any module so far: `restrictedTo('Moderator', 'Super Admin')`** —
> a real RBAC role gate, applied router-wide right after `protect`. This is the first genuinely
> role-restricted module in the registry; everything documented earlier (`protect`/`protectAny`)
> only checks *authentication*, not *role*.

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/queue` | `getModerationQueue` | |
| PATCH | `/reports/:id/resolve` | `resolveReport` | |
| PATCH | `/reports/:id/assign` | `assignReport` | |
| POST | `/reports/bulk-resolve` | `bulkResolveReports` | |

## Known issues found while building this registry

- **This is an admin/moderator-only module, not a regular end-user surface.** Relevant for the
  Frontend Contract and later page-mapping steps: any "Moderation Queue" UI belongs in an
  admin-role-gated area of the app, not the general authenticated app shell — attempting to call
  these from a normal user session will 403 via `restrictedTo`, not just require login.
- Worth checking during the auth/roles deep-dive (not done this pass) how many roles exist
  (`restrictedTo` implies a `role` field with at least `'Moderator'` and `'Super Admin'` as known
  values) and whether the current frontend has any admin surface at all — Step 1 audit did not
  explicitly confirm one exists in the PWA.
