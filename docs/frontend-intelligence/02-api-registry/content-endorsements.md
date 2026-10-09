# API Registry — Content Endorsements

> Mount: `app.use("/api/v1/content-endorsements", endorsementRoutes)` — `app.ts:340`
> Source: `NeyborHuud-ServerSide/src/modules/content/endorsement.routes.ts`
>
> **Total: 2 routes.**
>
> **A fourth distinct authorization pattern**, on top of `protect`/`protectAny`/
> `protectWithBetterAuth` (auth) and `restrictedTo`/`requireAdmin` (role-based RBAC): this file uses
> `requirePermission('content:endorse')` (`rbac.middleware.ts:11-30`), which checks a granular
> **permission string** via `rbacService.hasPermission(userId, action)` — not a role name. A more
> fine-grained system than `restrictedTo`'s role-list check, and it logs unauthorized attempts to
> the audit service.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/:contentId/endorsements` | public | `getContentEndorsements` | Source comment: `"Public read access? Or protected? Let's say public can view endorsements."` — an explicit, unresolved author uncertainty left in the code, not a considered decision |
| POST | `/:contentId/endorse` | `protect`, `requirePermission('content:endorse')` | `endorseContent` | Source comment: "Only authorities can endorse" |

## Known issues found while building this registry

- The `GET` route's own source comment shows the original author was unsure whether it should be
  public — worth surfacing to whoever owns this feature rather than assuming the current behavior
  (public) is deliberate.
- This is the same "endorsement" concept referenced by `fyi.md`'s `/fyi/:id/endorse` /
  `/fyi/:id/endorsements` routes, but that module uses plain `protect` with only a comment implying
  role restriction, while this module uses the real `requirePermission` gate. Two different
  endorsement systems with two different enforcement levels for what sounds like the same product
  concept ("authorities endorsing content") — worth reconciling in the product/feature-mapping
  step, since the frontend may need one unified "Endorse" UI action that's actually backed by two
  different backend systems depending on content type.
