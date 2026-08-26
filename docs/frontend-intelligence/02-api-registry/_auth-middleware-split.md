# Cross-cutting finding — `protect` vs `protectAny` split across the backend

> This isn't specific to one module — it affects the majority of the backend and is worth its own
> file rather than burying it in one module's registry entry.

## What was found

`NeyborHuud-ServerSide/src/middlewares/auth.middleware.ts` exports two different auth gates:

- **`protect`** (line 451) — accepts **only** an `Authorization: Bearer <token>` header. Rejects
  immediately with 401 if that header is missing, with no fallback.
- **`protectAny`** — accepts *either* a Bearer token *or* a Better Auth session (cookie-based).

Grepping every `.routes.ts` file in `src/modules/` for which one each module actually uses:

**Uses `protectAny` (accepts session cookie OR Bearer):** `auth`, `content` (+ `feed` alias),
`profile`, `safety`, `search` — **6 route files total.**

**Uses only bare `protect` (Bearer token required, no cookie fallback):** `admin`,
`admin/compliance` (dead anyway), `analytics`, `chat`, `connections`, `content/endorsement`,
`content/fyi`, `departments`, `events`, `follow`, `gamification`, `geo`, `hub-community`,
`identity`, `incidentReport`, `jobs`, `marketplace`, `media`, `media/optimization`, `mobile`,
`moderation`, `notifications`, `payments`, `ratings`, `recommendations`, `services`, `trust` —
**27 route files.**

## Why this isn't (currently) breaking anything

Checked the frontend's `ApiClient` (`pwa/src/lib/api-client.ts`) directly: it's Axios-based with
no `withCredentials`/`credentials` setting anywhere, meaning it does not send cookies cross-origin
by Axios's default behavior. Combined with the Step 1 finding that the frontend's real auth
architecture is a hand-rolled Bearer-token system (`auth.service.ts`, token read from
`localStorage`) rather than a Better Auth cookie session — **the frontend always sends a Bearer
token on authenticated requests today**, so the `protectAny` modules' cookie-fallback capability is
effectively unused, and the `protect`-only modules' lack of that fallback doesn't currently produce
any user-visible failure.

## Why it still matters for the rebuild

- It's a real architectural inconsistency: two auth philosophies coexist in the same backend, for
  no functional reason found so far (nothing suggests `content`/`safety`/`profile`/`search`/`auth`
  specifically *need* cookie-session support while the other 27 modules don't).
- If the rebuild (or any future change) ever moves toward relying on Better Auth's session cookie
  instead of manually managing a Bearer token client-side — a very plausible direction, since
  `better-auth` is already a real backend dependency — **27 of the backend's ~34 modules would
  start rejecting those requests with 401s**, silently, until each route file is updated to
  `protectAny`.
- Worth a product/engineering decision now, while building the Frontend Contract, rather than
  discovering it mid-rebuild: standardize the whole backend on `protectAny` (safe superset of
  current behavior — accepts what `protect` accepts, plus more), or explicitly confirm
  Bearer-only is the permanent intended auth model and document why cookie support exists at all
  in the 6 modules that have it.

## Recommendation

Standardizing all 27 `protect`-only modules to `protectAny` is a low-risk, backend-only change
(strictly widens what's accepted, doesn't narrow it) that removes this inconsistency before the
rebuild's design/implementation phases begin — worth doing as a small, isolated backend PR rather
than carrying this split into the new frontend's contract.
