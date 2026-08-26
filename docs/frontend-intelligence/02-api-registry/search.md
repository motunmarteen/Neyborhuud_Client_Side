# API Registry — Search

> Mount: `app.use("/api/v1/search", searchRoutes)` — `app.ts:322`
> Source: `NeyborHuud-ServerSide/src/modules/search/search.routes.ts`
>
> **Total: 4 routes.** One of the 6 modules using `protectAny` (Bearer or cookie session — see
> `_auth-middleware-split.md`), on the AI search route only.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/` | `optionalAuth` | `globalSearch` | "Instagram/X style" global search per comment; optional auth for personalized results when logged in |
| POST | `/ai` | rate-limited (`searchLimiter`), `protectAny` | `aiSearch` | AI-powered search |
| GET | `/suggestions` | public | `getSuggestions` | |
| GET | `/trends` | public | `getTrends` | |

## Known issues found while building this registry

- None. Smallest module registered so far; auth choices are all deliberate and match their
  described purpose (public discovery endpoints, optional-auth for personalization, full auth +
  rate limit only on the AI-powered route which presumably carries real inference cost).
