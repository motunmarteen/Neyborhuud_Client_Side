# API Registry — Gossip / Huud Gist

> Mounts: `app.use("/api/v1/gossip", gossipRoutes)` — `app.ts:330`, and
> `app.use("/api/v1/huud-gist", huudGistChannel, gossipRoutes)` — `app.ts:331`
> Source: `NeyborHuud-ServerSide/src/modules/content/gossip.routes.ts` (lives under `modules/content/`,
> not its own top-level module directory — same pattern as `fyi.md`)
>
> Both mounts serve the **same router**; `huudGistChannel` (`huudGist.middleware.ts`) just tags the
> request so controllers can filter to Huud Gist-specific content. Frontend uses the `/huud-gist`
> mount exclusively (`pwa/src/services/huudGist.service.ts`, `BASE = '/huud-gist'`) — `/gossip` as a
> direct mount appears unused by the current frontend, not independently confirmed further.
>
> **Total: 13 routes** (counted once; identical set reachable at both mount paths).

## ✅ FIXED — was a confirmed live bug, resolved 2026-08-27

This module was the **first case found where the auth mismatch was not theoretical**. It used a
**third, previously uncatalogued middleware: `protectWithBetterAuth`** (`auth.middleware.ts:77-126`),
which checks a Better Auth session cookie ONLY, with no Bearer-token fallback — the inverse of
`protect`. Since the frontend's `ApiClient` is Bearer-only with no cookie handling
(`pwa/src/lib/api-client.ts:26-53`), every route gated by it 401'd for every real user, every time.

Confirmed at the time as live, wired frontend code via `pwa/src/hooks/useHuudGist.ts`'s
`useHuudGistMutations` (like, comment, create, update, delete) → `huudGistService` → `apiClient`.

**Fix applied**: swapped `protectWithBetterAuth` → `protectAny` on all 8 affected routes in
`NeyborHuud-ServerSide/src/modules/content/gossip.routes.ts` (import + every usage), matching the
already-proven pattern used in `auth`/`content`/`profile`/`safety`/`search`. Verified safe before
applying: `protectAny` sets a strict superset of what `protectWithBetterAuth` set (`req.user`,
`req.session`, `req.userRoles`, `req.permissions` — all four, vs. the old middleware's four), and
`gossip.controller.ts` has zero references to `req.session` that could behave differently. Ran
`tsc --noEmit` (clean) and the full `tests/gossip.test.ts` suite (79/79 passing) after the change —
that suite tests the controller directly via mock req/res so it doesn't exercise the router/
middleware layer itself, but confirms nothing downstream broke.

## Routes

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/me` | `protectAny` | `getUserGossips` | Fixed — was `protectWithBetterAuth` |
| GET | `/sections` | public | `listHuudGistSections` | |
| POST | `/` | `protectAny`, `requireVerified`, `requireNigeriaLocation`, validated | `createGossip` | Fixed — was `protectWithBetterAuth` |
| GET | `/` | `optionalAuth` | `listGossip` | |
| GET | `/:id` | `optionalAuth` | `getGossip` | |
| PUT | `/:id` | `protectAny`, validated | `updateGossip` | Fixed — was `protectWithBetterAuth` |
| DELETE | `/:id` | `protectAny` | `deleteGossip` | Fixed — was `protectWithBetterAuth` |
| POST | `/:id/like` | `protectAny` | `likeGossip` | Fixed — was `protectWithBetterAuth` |
| POST | `/:gossipId/comments` | `protectAny`, validated | `addGossipComment` | Fixed — was `protectWithBetterAuth` |
| GET | `/:gossipId/comments` | `protectAny` | `listComments` | Fixed — was `protectWithBetterAuth` |
| POST | `/:gossipId/comments/:commentId/like` | `protectAny` | `likeComment` | Fixed — was `protectWithBetterAuth` |
| DELETE | `/:gossipId/comments/:commentId` | `protectAny` | `deleteComment` | Fixed — was `protectWithBetterAuth` |

## Known issues found while building this registry

- **See fixed finding above** — this was the top-priority backend issue found in the entire API
  registry, more severe than the fake-KYC finding in `identity.md` because it was a currently-broken
  user-facing feature (posting/commenting/liking), not one that silently under-delivered. Now
  resolved; no longer a blocker for the rebuild.
- `protectWithBetterAuth` itself is still exported from `auth.middleware.ts` but as of this fix has
  no remaining callers anywhere in `src/` — a candidate for removal in a future backend cleanup, not
  done here since it's out of scope for this specific bug fix.
- `createGossip` also requires `requireNigeriaLocation` — a middleware not seen in any other module
  registered so far; worth noting for the geo/location-gating pattern used elsewhere in the app.
- The dual-mount (`/gossip` and `/huud-gist` serving the same router, disambiguated only by a
  request-tagging middleware) is an unusual pattern — worth confirming in a later step whether
  `/gossip` is fully dead weight the rebuild can ignore, or still reachable/used somewhere not yet
  found.
