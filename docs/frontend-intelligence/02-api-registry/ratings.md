# API Registry — Ratings

> Mount: `app.use("/api/v1/ratings", ratingRoutes)` — `app.ts:324`
> Source: `NeyborHuud-ServerSide/src/modules/ratings/rating.routes.ts`
>
> **Total: 2 routes.** Both `protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Handler |
|---|---|---|
| POST | `/` | `submitRating` |
| GET | `/` | `getRatings` |

## Known issues found while building this registry

- None. Smallest module in the registry so far — a generic rating primitive, likely consumed by
  other modules (services, marketplace) rather than used standalone; worth checking during the
  feature-mapping step whether this is actually reachable/used by the frontend at all, or whether
  ratings are fully absorbed into `service.routes.ts`'s own `/:id/rate` (see `services.md`).
