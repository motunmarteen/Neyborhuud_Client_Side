# NeyborHuud Frontend Rebuild — Step 1 Audit Report

> **Status:** Complete. Read-only audit — no code was modified during this pass.
> **Branch:** `frontend-rebuild`
> **Date:** 2026-08-26
> **Scope:** `NeyborHuud-PWA` (frontend) + `NeyborHuud-ServerSide` (backend), cross-verified from source.
>
> This is the foundation document for the rebuild. Steps 2+ should treat every claim here as
> either "directly verified from source" (stated as fact) or "not independently re-verified"
> (stated explicitly as such) — never assume a claim is solid just because it's written down.

---

## 1. Executive Summary

NeyborHuud is a hyperlocal safety, social, and commerce platform for Nigeria, built as a pnpm
monorepo containing two Next.js applications (`pwa/` — the product; `landing/` — marketing site)
plus a separate Express/MongoDB backend repo. The frontend is mature and substantially complete —
not a greenfield rebuild target in the sense of "little exists." It has 34 backend feature modules
serving **565 confirmed route definitions** (not "300+" — verified by direct grep count, not
estimate), 29 frontend feature services, 38 component subdirectories, and 56 custom hooks.

An existing hand-maintained audit doc (`PLATFORM_FEATURES.md`, dated 2026-07-06, at the root of
`NeyborHuud-PWA`) already covers much of the ground Step 1 asks for — but direct source
verification found it contains **at least one seriously incorrect claim** (see §16), so it should
be treated as a lead, not a source of truth.

---

## 2. Repository Structure

```
neyborhuud/                          (no parent git repo — each project below is its own repo)
├── NeyborHuud-PWA/                  git repo, pnpm workspace
│   ├── pwa/                         The product app (app.neyborhuud.com)
│   └── landing/                     Marketing site (neyborhuud.com)
├── NeyborHuud-ServerSide/           git repo — Express/MongoDB backend (api.neyborhuud.com)
├── neyborhuud-landing/              ⚠️ STALE — appears to be a pre-monorepo duplicate of landing/
├── NeyborHuud-PWA.worktrees/        ⚠️ STALE — leftover Copilot worktree, dated April
└── (assorted top-level docs, images, a case study, deploy scripts)
```

`NeyborHuud-PWA` is a pnpm workspace (`pnpm-workspace.yaml`) with `dev:pwa`/`landing dev` scripts
run from the monorepo root. `NeyborHuud-ServerSide` is fully separate — no shared tooling,
connected only over HTTP/WebSocket.

---

## 3. Technology Stack (verified from `package.json`, not estimated)

### Frontend (`pwa/`)
- Next.js 16.2.11, React 19.2.3 (React Compiler enabled via `babel-plugin-react-compiler`)
- Tailwind CSS v4
- TanStack Query v5 (server state) — no Redux/Zustand
- Socket.IO client v4
- Axios (hand-built `ApiClient` wrapper, not raw fetch)
- `better-auth` v1.6.21 — **installed but zero imports found in source** (dead dependency)
- `maplibre-gl` — actively used (2 files). `leaflet`, `react-leaflet`, `@react-google-maps/api` —
  **installed but zero imports found** (dead dependencies, real bundle-size cost)
- `next-pwa` v5.6 for service worker generation
- Capacitor 8 (Android native wrapper; iOS explicitly deferred per component code)
- Vitest 4 (`pool: 'forks'`), Playwright present but no CI-integrated e2e suite found
- `sonner` (toasts), `framer-motion`, `lottie-react`, `canvas-confetti`

### Backend (`NeyborHuud-ServerSide`)
- Node/Express, MongoDB via Mongoose 9.8.0
- `better-auth` — genuinely used here (server-side session/user model)
- BullMQ (Redis-backed queues, currently running in inline-fallback mode in production —
  `DISABLE_REDIS_QUEUES=true`)
- Socket.IO server
- Sentry, Firebase Admin (push), Cloudinary (media), Flutterwave (payments — Naira-side only)

---

## 4. Frontend Architecture (verified directly)

Route groups: `(app)` (authenticated shell) and `(marketing)` (unauthenticated), plus a standalone
`app-root/` (the actual marketing landing/login screen served at `app.neyborhuud.com` root).
Middleware (`src/middleware.ts`) does subdomain-based rewriting.

Feature-oriented structure, already largely matching what a rebuild would want to establish fresh:
- `services/` (29 files) — the API abstraction layer; components do not call `apiClient` directly
  in the samples checked (spot-verified `content.service.ts` — real normalization logic, not a
  thin pass-through)
- `hooks/` (56 files) — feature-scoped data hooks (`useLocationFeed`, `usePostMutations`, etc.)
- `components/` (38 subdirectories) — organized by feature domain (`safety/`, `sentinel/`,
  `marketplace/`, `chat/`, etc.), plus `ui/`, `layout/`, `navigation/`, `shared/`
- Global client state kept intentionally narrow: `SosContext`, `GuardianAlertsContext`,
  `SwipeBackContext`, `CallProvider` — server state lives in React Query, not a global store

**Authentication**: custom Bearer-token system through `ApiClient` (Axios), not Better Auth's
session/cookie model despite the dependency being present. 401-handling is deliberately
non-naive — pattern-matches error messages to avoid false-logout on guest-accessible endpoints
returning 401. `auth.service.ts` (892 lines) is the real, comprehensive auth surface:
register/login/logout, community confirmation, profile CRUD, password reset, email verification
(dual OTP + legacy token), consent/data-export (NDPR compliance), account deletion.

---

## 5. Backend Architecture (verified directly)

34 feature modules under `src/modules/`, **565 route definitions** (233 GET, 233 POST, 44 DELETE,
42 PATCH, 13 PUT — exact counts via `grep`). 14 middleware files including dedicated
`rbac.middleware.ts` (role-based permissions) and `nigeriaLocation.middleware.ts` (a hard
product-level Nigeria gate). 37 Mongoose model files (~7,300 lines).

No comprehensive OpenAPI spec exists. `docs/neyborhuud.yml` is a real OpenAPI 3.0.3 file but only
186 lines / a handful of sample endpoints — a skeleton/demo, not the 565-route source of truth the
rebuild plan hoped to use. **This is a genuine gap** — Step 2 (API inventory) will need to be built
from route-file inspection, not from an existing spec.

---

## 6. Product Feature Map

Confirmed live, matching both frontend routes and backend modules: Auth/Onboarding, Feed/Social
(+ Gist/Gossip, FYI, Help Request, Local News, Incident Reports), Marketplace, Chat/Messaging
(+ WebRTC calling), Communities/Neighborhoods, Events, Jobs & Services, Gamification/HuudCoin,
Safety/Sentinel (largest pillar — SOS, guardians, trips, geofences, panic PIN, fake-call decoy),
Profile/Social graph, Notifications, Maps/Location, Premium/Payments (HuudCoin-scoped, no fiat
gateway), Settings, Admin (thinnest area — only 3 sub-pages), Info/Legal.

**All 12 route directories the existing doc labeled "stale leftovers" are confirmed live** — see §16.

---

## 7. Routing Map

`(app)` group top-level routes (verified via direct directory listing): `admin`, `chat`,
`communities`, `community-emergency`, `events`, `explore`, `feed`, `friendship`, `fyi`,
`gamification`, `gist`, `gossip`, `help-request`, `huud-economy`, `incident-reports`, `info`,
`jobs`, `local-news`, `map`, `marketplace`, `messages`, `neighborhood`, `notifications`, `popular`,
`premium`, `profile`, `safety`, `saved`, `services`, `settings`, `sos`, `work`.

`/feed` is confirmed (via direct read of `authSession.ts`'s `resolvePostAuthRoute`, line 140) to
be the actual primary post-login destination for returning users — **not dead code**.

---

## 8. Major Components

Spot-verified: `XFeed`/`XFeedInner` (`feed/page.tsx`, 815 lines — real, current, deeply-wired
implementation with discovery-pool blending, Sentinel row, red-zone banner, optimistic mutations),
the full `services/` layer, `TopNav`/`LeftSidebar`/`RightSidebar`/`BottomNav` navigation shell,
`GeofenceMap`/`InteractiveMap` (maplibre-gl based).

---

## 9. API Architecture Summary

APIs are organized one `.routes.ts` + `.controller.ts` (+ often `.service.ts`) file per backend
module, mounted under `/api/v1`. Frontend consumes them exclusively through the `services/`
abstraction layer, itself built on a single shared `ApiClient` (Axios) instance with centralized
auth-header injection and 401 handling. Detailed per-endpoint inventory is Step 2's job.

---

## 10. Authentication and Authorization

Backend: JWT Bearer tokens, `rbac.middleware.ts` for role/permission checks, `better-auth`
genuinely integrated server-side. Frontend: custom token storage/refresh via `auth.service.ts`,
non-naive 401 interceptor. `better-auth` frontend package is dead weight — confirms auth logic
lives entirely in the hand-rolled system, not the library.

---

## 11. Realtime Architecture

Socket.IO both sides. Backend emits **58 distinct event names** (verified via grep); frontend
registers **62 distinct listeners** — roughly matching scale. Full event-by-event mapping is
later-step work (API inventory / user journeys), not this step's.

---

## 12. PWA Architecture

Verified directly from `next.config.ts`: dual-mode build — `NEXT_PUBLIC_CAP=1` produces a static
export for Capacitor (no Node server, PWA disabled, images unoptimized); the default build is a
full PWA via `next-pwa`, with deliberately NetworkFirst caching for HTML/JS/CSS specifically to
avoid stale-bundle incidents after deploys (comments reference real production incidents this
config was hardened against). Config is genuinely mature, not scaffolding.

---

## 13. Mobile Behaviour

Real Capacitor-wrapped Android app (`com.neyborhuud.app`), Android-first, iOS explicitly deferred.
Named native plugins in `package.json`: app, camera, geolocation, haptics, network, preferences,
share, splash-screen, status-bar. No native push (`@capacitor/push-notifications`) — only Web Push
(VAPID) exists on either side; a genuine two-sided gap if native push is ever wanted.

---

## 14. External Services

Backend: Cloudinary (media), Firebase Admin (Web Push only), Sentry, Flutterwave. Frontend: direct
Nominatim reverse-geocode calls proxied through Next.js API routes (`/api/geocode/*`) to dodge
CORS — these **do not exist in the Capacitor static-export build** (no Node server), a real gap
specific to the native Android app (per the existing doc — not independently re-verified this
pass, but plausible given the static-export architecture confirmed in `next.config.ts`).

---

## 15. Technical Risks for the Rebuild

- **No real OpenAPI spec** — the API registry (Step 2) must be hand-built from source.
- **Two overlapping route trees for the same feature**: `/gamification` vs `/huud-economy` —
  confirmed present. Needs a product decision before design work.
- **Duplicate/unused dependencies** (`better-auth`, `leaflet`, `react-leaflet`,
  `@react-google-maps/api` frontend-side) — worth pruning before a rebuild baseline is cut.
- **Stale top-level `neyborhuud-landing` and `.worktrees` folders** sitting outside both real git
  repos — confirm genuinely abandoned before continuing, so nobody edits the wrong copy.
- **`PLATFORM_FEATURES.md`'s routing-staleness claim is factually wrong** (§16) — treat any other
  unverified claim in that doc as unconfirmed until independently checked.

---

## 16. Unknowns and Ambiguities

- **Critical correction to existing documentation**: `PLATFORM_FEATURES.md` states 12 top-level
  route directories (`community-emergency`, `events`, `explore`, `feed`, `friendship`, `fyi`,
  `help-request`, `incident-reports`, `jobs`, `map`, `marketplace`, `services`) are "stale
  leftovers from before the route-group split — safe to ignore/clean up." **This is false.**
  Direct verification found: (a) `/feed` is the actual primary post-login landing route
  (`authSession.ts:140`); (b) 51 files across the frontend actively `router.push`/`href` into
  these exact 12 directories, including core navigation shell components (`TopNav`,
  `LeftSidebar`, `RightSidebar`, `Sidebar`, `GlobalSearch`) and global error handling
  (`app/error.tsx`, `NotFoundPage`). **Any rebuild plan must NOT delete or deprioritize these
  routes based on that doc's claim.**
- The backend's `PLATFORM_FEATURES.md` companion doc, cross-referenced throughout the PWA's
  version (`[[backend §N: ...]]` links), **no longer exists in the backend repo** — either
  deleted, renamed, or never committed. The PWA doc's backend-side gap claims (identity/KYC being
  fake, admin analytics stubs, agency dispatch mock mode, etc.) could not be cross-verified this
  pass — some are independently known to be stale already (emergency dispatch was redesigned away
  from mock mode after this doc's July date, per separate backend work).
- Whether `neyborhuud-landing` (top-level) and `NeyborHuud-PWA.worktrees` are genuinely safe to
  delete, versus containing unmerged work, was not confirmed — flagged, not acted on.
- The doc's per-feature "gap" claims (2FA missing, HuudCoin-as-currency deferred, marketplace QA
  checklist incomplete, admin analytics returning 0, community governance being a stub, test
  coverage concentrated on auth/navigation utilities) were **not independently re-verified this
  pass** — plausible and specific, but given the routing claim's error, each should get a quick
  source-check before being treated as settled fact in later steps.

---

## 17. Rebuild Constraints

- Must preserve the `(app)`/`(marketing)` route-group split and subdomain-rewrite middleware —
  load-bearing production routing, not incidental structure.
- Must preserve the existing `services/` → `ApiClient` abstraction pattern — already close to the
  "Frontend Contract" a rebuild would want, not something to redesign from scratch.
- Must preserve the PWA caching strategy exactly as configured (NetworkFirst for HTML/JS/CSS) — it
  was hardened against real, specific production incidents.
- Must account for the Capacitor static-export build mode as a first-class target — real
  behavioral differences (no Node server, no Next API route proxies, unoptimized images) that a
  redesign could silently break if only the web/PWA path is tested.
- Must not treat Nigeria-only geofencing (`nigeriaLocation.middleware.ts`) as incidental — any
  rebuild that changes onboarding flow must respect it.

---

## Audit Status

| Area | Inspected |
|---|---|
| Repository | YES |
| Frontend | YES |
| Backend | YES |
| Authentication | YES |
| Routing | YES |
| Realtime | YES |
| PWA | YES |
| External services | YES (partial — Nominatim proxy gap not re-verified independently) |
| Major unknowns identified | YES |

## Recommended Next Step

Step 2 (API Inventory) should build the actual API registry from direct route-file inspection —
not from `docs/neyborhuud.yml` (too sparse) and not by assuming any single existing doc is
authoritative. It should also resolve the specific open questions flagged in §16 (gamification/
huud-economy duplication decision, the two stray top-level directories, and spot-checking a sample
of the unverified gap claims) before Step 4 (feature/page mapping) begins, since that step will
inherit whatever Step 2 gets wrong.
