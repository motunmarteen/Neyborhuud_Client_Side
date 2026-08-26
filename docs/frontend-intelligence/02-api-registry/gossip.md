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

## 🔴 CRITICAL — confirmed live bug, not a latent inconsistency

This module is the **first case found where the auth mismatch is not theoretical**. Unlike
`_auth-middleware-split.md`'s `protect`-only modules (which still accept Bearer tokens fine), this
module uses a **third, previously uncatalogued middleware: `protectWithBetterAuth`**
(`auth.middleware.ts:77-126`). Read directly from source:

```ts
const session = await betterAuth.api.getSession({ headers: fromNodeHeaders(req.headers) });
if (!session || !session.user) {
  return errorResponse(res, "Not authorized to access this route", 401);
}
```

**This checks a Better Auth session cookie ONLY. There is no Bearer-token fallback path at all** —
the inverse of `protect` (which is Bearer-only with no cookie fallback). Verified the frontend's
`ApiClient` (`pwa/src/lib/api-client.ts:26-53`) sends `Authorization: Bearer <token>` on every
request and has no `withCredentials`/cookie handling anywhere in the file — the same fact already
used in `_auth-middleware-split.md` to conclude the `protect`-only split "isn't currently breaking
anything." Here it's the opposite conclusion: **a Bearer-token-only frontend can never satisfy
`protectWithBetterAuth`, so every route gated by it in this file will 401 for every real user,
every time.**

Confirmed this is live, wired frontend code, not dead/unused: `pwa/src/hooks/useHuudGist.ts`'s
`useHuudGistMutations` (like, comment, create, update, delete) calls straight into
`huudGistService`, which calls `apiClient` (Bearer-only) against these exact routes. The `/gist`
and `/gossip` pages (`pwa/src/app/(app)/gist/`, `pwa/src/app/(app)/gossip/`) are real, mounted
routes per the directory scan in Step 1.

**Net effect**: browsing/listing Huud Gist threads works (those two routes use `optionalAuth`, see
table), but **creating a thread, editing, deleting, liking, and all commenting are broken for every
user on the current frontend.** This is very likely an active, user-visible production bug today,
not something introduced by the rebuild's discovery process — flagging for the user to decide
whether to fix immediately (backend-only, low-risk: change `protectWithBetterAuth` → `protectAny`
on this file, mirroring the already-working pattern in `content`/`safety`/`profile`/`search`/`auth`)
or intentionally defer to a later phase.

## Routes

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/me` | `protectWithBetterAuth` ⚠️ | `getUserGossips` | Broken — see above |
| GET | `/sections` | public | `listHuudGistSections` | Works |
| POST | `/` | `protectWithBetterAuth` ⚠️, `requireVerified`, `requireNigeriaLocation`, validated | `createGossip` | Broken — see above |
| GET | `/` | `optionalAuth` | `listGossip` | Works |
| GET | `/:id` | `optionalAuth` | `getGossip` | Works |
| PUT | `/:id` | `protectWithBetterAuth` ⚠️, validated | `updateGossip` | Broken |
| DELETE | `/:id` | `protectWithBetterAuth` ⚠️ | `deleteGossip` | Broken |
| POST | `/:id/like` | `protectWithBetterAuth` ⚠️ | `likeGossip` | Broken |
| POST | `/:gossipId/comments` | `protectWithBetterAuth` ⚠️, validated | `addGossipComment` | Broken |
| GET | `/:gossipId/comments` | `protectWithBetterAuth` ⚠️ | `listComments` | Broken — even reading comments requires this |
| POST | `/:gossipId/comments/:commentId/like` | `protectWithBetterAuth` ⚠️ | `likeComment` | Broken |
| DELETE | `/:gossipId/comments/:commentId` | `protectWithBetterAuth` ⚠️ | `deleteComment` | Broken |

## Known issues found while building this registry

- **See critical finding above — this is the top-priority backend issue found in the entire API
  registry so far**, more severe than the fake-KYC finding in `identity.md` because it's a
  currently-broken user-facing feature (posting/commenting/liking) rather than a feature that
  silently under-delivers.
- `createGossip` also requires `requireNigeriaLocation` — a middleware not seen in any other module
  registered so far; worth noting for the geo/location-gating pattern used elsewhere in the app.
- The dual-mount (`/gossip` and `/huud-gist` serving the same router, disambiguated only by a
  request-tagging middleware) is an unusual pattern — worth confirming in a later step whether
  `/gossip` is fully dead weight the rebuild can ignore, or still reachable/used somewhere not yet
  found.
