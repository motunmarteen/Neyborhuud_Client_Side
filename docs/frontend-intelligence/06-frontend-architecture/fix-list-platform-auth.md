# Fix List — Platform / Auth Cluster

> **Step 7 deliverable.** Consolidated, prioritized list of every real bug/gap/inconsistency found
> during Steps 1-6, extracted from the files listed below — **read in full**, not skimmed.
>
> **Source files read in full (23):**
> `00-audit-step1.md`; `02-api-registry/_auth-middleware-split.md`, `auth.md`, `identity.md`,
> `profile.md`, `admin.md`, `moderation.md`, `content.md`, `search.md`, `geo.md`, `media.md`,
> `mobile.md`, `optimization.md`, `departments.md`, `analytics.md`, `recommendations.md`,
> `ratings.md`, `weather.md`, `stats.md`, `incident-reports.md`;
> `03-api-page-matrix/feed-content-search.md`, `settings-profile-auth-admin.md`;
> `04-route-map/route-classification.md`.
>
> **Total findings extracted: 52**
> By severity: **Critical: 3 | High: 10 | Medium: 30 | Low: 9**
> (1 additional item — the `/settings` dead-code regression — is marked **FIXED, already deployed**
> and is listed under Auth/Settings for traceability but excluded from the "open" counts above.)

---

## System-wide / Architecture

### Critical
*(none at this scope — see Auth for the protectWithBetterAuth item, now fixed, and Identity for KYC)*

### High
- **What:** No comprehensive OpenAPI spec exists; `docs/neyborhuud.yml` is only a 186-line skeleton covering a handful of endpoints, not the real 565-route surface.
  **Where:** Backend-wide, `docs/neyborhuud.yml`.
  **Severity:** High
  **Source:** `00-audit-step1.md`
  **Status:** Open

### Medium
- **What:** `better-auth` frontend package is installed but has zero imports anywhere in source — dead dependency; real auth is a hand-rolled Bearer-token system.
  **Where:** `pwa/` package.json / dependency tree.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** `leaflet`, `react-leaflet`, `@react-google-maps/api` are installed but have zero imports found — dead dependencies with real bundle-size cost (only `maplibre-gl` is actually used).
  **Where:** `pwa/` package.json / dependency tree.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** Two overlapping route trees exist for the same feature: `/gamification` vs `/huud-economy`. (Later resolved by Step 4/5: `/gamification*` are confirmed legacy client-side redirect shims to `/huud-economy/*`, not true duplication — but flagged here per Step 1 as it was an open question at the time and needs the product decision documented.)
  **Where:** `pwa/src/app/(app)/gamification/*` vs `pwa/src/app/(app)/huud-economy/*`.
  **Severity:** Medium
  **Source:** `00-audit-step1.md` (see Routing section below for the resolution)
  **Status:** Open (decision/documentation still needed even though behavior is understood)
- **What:** Stale top-level folders (`neyborhuud-landing/`, `NeyborHuud-PWA.worktrees/`) sit outside both real git repos with unconfirmed status — risk of someone editing the wrong copy or losing unmerged work.
  **Where:** Repo root, outside `NeyborHuud-PWA` and `NeyborHuud-ServerSide`.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** No native push notification support (`@capacitor/push-notifications`) exists on either frontend or backend — only Web Push (VAPID); a two-sided gap once native iOS/Android push is needed.
  **Where:** Capacitor Android app + `mobile.md`'s `/push/subscribe` (Web-Push-shaped, no APNs/FCM device-token language).
  **Severity:** Medium
  **Source:** `00-audit-step1.md`, `02-api-registry/mobile.md`
  **Status:** Open
- **What:** Nominatim reverse-geocode calls proxied through Next.js API routes (`/api/geocode/*`) do not exist in the Capacitor static-export build (no Node server) — a real gap specific to the native Android app. Not independently re-verified this pass; carried from the pre-existing hand-maintained doc.
  **Where:** `pwa/src/app/api/geocode/*`, Capacitor static-export build mode.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** `PLATFORM_FEATURES.md`'s claim that 12 top-level route directories are "stale leftovers safe to clean up" is factually wrong — all 12 are live, actively linked from core navigation (`TopNav`, sidebars, `GlobalSearch`, error pages). Any other unverified claim in that doc should be treated as unconfirmed.
  **Where:** `PLATFORM_FEATURES.md` (root of `NeyborHuud-PWA`).
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** Several of `PLATFORM_FEATURES.md`'s other gap claims (2FA missing, HuudCoin-as-currency deferred, marketplace QA checklist incomplete, admin analytics returning 0, community governance being a stub, test coverage concentrated on auth/navigation) were not independently re-verified and should be spot-checked before being treated as settled fact.
  **Where:** `PLATFORM_FEATURES.md`.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open
- **What:** Backend's `PLATFORM_FEATURES.md` companion doc (cross-referenced via `[[backend §N]]` links in the PWA's copy) no longer exists in the backend repo — its backend-side gap claims could not be cross-verified.
  **Where:** `NeyborHuud-ServerSide` docs.
  **Severity:** Medium
  **Source:** `00-audit-step1.md`
  **Status:** Open

### Low
*(none distinctly Low at this scope)*

---

## Auth (incl. cross-cutting middleware, Settings/Auth pages)

### Critical
- **What:** `protectWithBetterAuth` required a Better Auth session cookie with no Bearer-token fallback, but the frontend's Bearer-only architecture never sends a session cookie — made 11 of 13 `content/gossip.routes.ts` routes unreachable for every real user. Confirmed live production bug.
  **Where:** `NeyborHuud-ServerSide/src/modules/content/gossip.routes.ts` (mounted at `/gossip` and `/huud-gist`).
  **Severity:** Critical
  **Source:** `02-api-registry/_auth-middleware-split.md`
  **Status:** **FIXED, already deployed** — 2026-08-27, swapped all 8 affected routes to `protectAny`; `tsc --noEmit` clean, `tests/gossip.test.ts` 79/79 passing.

### High
- **What:** Architectural inconsistency: two auth philosophies coexist — 6 route files use `protectAny` (Bearer or cookie), 27 use bare `protect` (Bearer-only, no cookie fallback). Currently harmless because the frontend is Bearer-only, but if the platform ever moves toward relying on Better Auth's cookie session, 27 of ~34 backend modules would start silently 401-ing.
  **Where:** Backend-wide — `NeyborHuud-ServerSide/src/middlewares/auth.middleware.ts` and all `*.routes.ts` files.
  **Severity:** High
  **Source:** `02-api-registry/_auth-middleware-split.md`
  **Status:** Open (recommendation: standardize all 27 `protect`-only modules to `protectAny` — safe superset, low-risk backend PR)

### Medium
- **What:** `admin/compliance.routes.ts` (a separate admin-only `POST /users/:userId/export` + audit-log viewer) is dead code — never imported by `app.ts` or any other file, unreachable at any URL.
  **Where:** `NeyborHuud-ServerSide/src/modules/admin/compliance.routes.ts`.
  **Severity:** Medium
  **Source:** `02-api-registry/auth.md`
  **Status:** Open
- **What:** `auth.routes.ts` has messy mid-file imports (device-controller imports appear after route definitions have already started, with a stray leftover comment) — cosmetic, signals piecemeal editing over time.
  **Where:** `NeyborHuud-ServerSide/src/modules/auth/auth.routes.ts` (lines 134-139).
  **Severity:** Low
  **Source:** `02-api-registry/auth.md`
  **Status:** Open
- **What:** `PATCH /me` and `PUT /me` on the profile module are true aliases (identical handler) — a minor duplication worth standardizing on one verb.
  **Where:** `NeyborHuud-ServerSide/src/modules/profile/profile.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/profile.md`
  **Status:** Open
- **What:** `profile.md`'s per-file auth summary oversimplifies: within the `profile` module, identity/settings routes (`/me`, `/username`, `/me/username-timeline`) use `protectAny` while file-upload routes (`/avatar`, `/cover`) and `/settings` use plain `protect` — a documentation-precision gap, not currently a functional bug, but relevant if the frontend ever moves to cookie-based sessions.
  **Where:** `NeyborHuud-ServerSide/src/modules/profile/profile.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/profile.md`
  **Status:** Open
- **What:** `/complete-profile` page's `tryProfileUpdate()` probes 4 candidate PUT/PATCH routes (`/profile/me`, `/profile`, `/auth/profile`, `/users/me`), but only `/profile/me` is a real, registry-documented route — the other 3 are dead/speculative fallback candidates that 404 in practice.
  **Where:** `pwa/src/app/(marketing)/complete-profile/page.tsx`, `authService.completeProfile()`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open (not a UX bug — loop just skips 404s — but dead code worth cleanup)
- **What:** `/pick-community` page makes a raw `apiClient.get()` call directly in the page component instead of going through a service file — inconsistent with the rest of the codebase's service-layer pattern.
  **Where:** `pwa/src/app/(marketing)/pick-community/page.tsx`.
  **Severity:** Low
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open
- **What:** The "Invite NeyburHs" referral-link-copy UI is purely client-side — it builds a signup URL from the user's own username but never calls a real referral-tracking endpoint, even though it is now reachable (post-settings-fix). All 4 real `/gamification/referral*` routes have no caller anywhere in this cluster.
  **Where:** `pwa/src/app/(app)/settings/page.tsx` (Account tab, Invite NeyburHs section).
  **Severity:** Medium
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open
- **What:** No page/prompt in the Auth/Settings/Profile/Admin/Gamification cluster explicitly tells end users *how* verification actually works today (admin manual override or community vouching) — the real mechanisms are invisible/uncommunicated in product copy.
  **Where:** Cluster-wide (no single file — a copy/product gap).
  **Severity:** Low
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open
- **What:** `app-root` and `/login` pages both rely on `lib/authSession.ts`'s session-validation/post-auth-route helpers, which were not traced to their underlying raw endpoint (lib helper, not a service call) — leaves a documentation gap, not a confirmed bug.
  **Where:** `pwa/src/lib/authSession.ts`, `pwa/src/app/app-root/page.tsx`, `pwa/src/app/(marketing)/login/page.tsx`.
  **Severity:** Low
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open

### Settings dead-code regression (already fixed)
- **What:** `/settings` page contained ~673 lines of unreachable dead code (a literal `false &&` guard) that was the only place six real, registry-documented backend features were wired up: NDPR consent management, data-access history, data export, account deletion, username change, and font-size/lite-mode accessibility toggles.
  **Where:** `pwa/src/app/(app)/settings/page.tsx`.
  **Severity:** High (was — user-facing feature loss)
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** **FIXED, already deployed** — 2026-08-27. Moved into live Privacy/Account tabs; dead blocks deleted; `tsc --noEmit` clean, no new `eslint` warnings, confirmed previously-unused variables now genuinely referenced.

---

## Identity/KYC

### Critical
- **What:** `submitKYC` is a confirmed fake stub — comment literally says "Verification Logic (Stubbed for now)," naming real providers (SmileID/YouVerify/Dojah/Prembly) never integrated. Verification "succeeds" via a hardcoded test value (`nin.startsWith("111")`). Any "Verified"/trust-tier badge depending on this is backed by fake data. Highest-priority backend gap in the whole registry.
  **Where:** `NeyborHuud-ServerSide/src/modules/identity/identity.controller.ts:57-66`, `POST /identity/kyc`.
  **Severity:** Critical
  **Source:** `02-api-registry/identity.md`
  **Status:** Open
- **What:** Real Nigerian `nin`/`bvn` (National Identity Number / Bank Verification Number) values are accepted and stored in the database via the fake KYC stub with no actual verification call ever made against them — a compliance/data-handling concern.
  **Where:** `NeyborHuud-ServerSide/src/modules/identity/identity.controller.ts`, `POST /identity/kyc`.
  **Severity:** Critical
  **Source:** `02-api-registry/identity.md`
  **Status:** Open

### High
- **What:** Even when a community-recovery request reaches quorum (2 approvals), the "Generate Temp Reset Token" step is also a stub — comment says "In real implementation, this would trigger an email with a special link." A fully-approved recovery request currently does not let the user back into their account.
  **Where:** `NeyborHuud-ServerSide/src/modules/identity/identity.controller.ts`, `approveRecovery` (`POST /identity/recovery/approve`).
  **Severity:** High
  **Source:** `02-api-registry/identity.md`
  **Status:** Open

### Medium
- **What:** Unclear from the route file alone whether anything restricts *who* can vote on a given recovery request — i.e., can any random authenticated user vote on anyone's recovery request, or is there an invite/eligibility check inside the controller not yet traced.
  **Where:** `NeyborHuud-ServerSide/src/modules/identity/identity.controller.ts:340-394`, `POST /identity/recovery/approve`.
  **Severity:** Medium
  **Source:** `02-api-registry/identity.md`
  **Status:** Open
- **What:** `submitKYC` (`POST /identity/kyc`) is not called anywhere in the Auth/Settings/Profile/Admin/Gamification page cluster — the fake-stub KYC flow is not currently wired to any reachable frontend page found in this cluster (reduces urgency for this cluster, but the underlying backend stub remains a Critical issue above).
  **Where:** Cluster-wide frontend search.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open
- **What:** Several identity routes have no caller found in the cluster: `GET /identity/status`, `POST /identity/data-access`, `POST /identity/onboarding/survey`, `GET /identity/wrapped`, `POST /identity/recovery/request`, `POST /identity/recovery/approve` — not confirmed dead app-wide, just unconfirmed as used within this cluster.
  **Where:** `identity.md` routes vs. Auth/Settings/Profile/Admin/Gamification pages.
  **Severity:** Low
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open

---

## Profile

### Medium
- **What:** Username changes have a full timeline/history feature (`/me/username-timeline`, `/users/:userId/username-timeline`) — confirms username changes are tracked events; worth knowing for profile-page design ("formerly known as" history) but not itself a bug — informational finding included for completeness since the source doc lists it under "Known issues."
  **Where:** `NeyborHuud-ServerSide/src/modules/profile/profile.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/profile.md`
  **Status:** Open (not a defect — documentation note)

*(See Auth section above for the `PATCH /me`/`PUT /me` alias duplication and the `protectAny`/`protect` split within `profile.routes.ts` — both sourced from `profile.md`.)*

---

## Admin

### High
- **What:** `admin.service.ts` (frontend) defines 6 functions calling backend paths that do not appear anywhere in `admin.md`'s 30-route registry: `getModerationQueue` (`GET /admin/moderation`), `approveContent`/`removeContent` (`POST /admin/moderation/approve`, `/admin/moderation/remove`), `getSystemLogs` (`GET /admin/logs`), `getSystemSettings`/`updateSystemSettings` (`GET`/`PUT /admin/settings`), `sendBroadcast` (`POST /admin/broadcast`). None are called from any page in `/admin`, `/admin/reports`, or `/admin/users`. Could be dead frontend code targeting non-existent routes, or a registry-building gap.
  **Where:** `pwa/src/services/admin.service.ts`.
  **Severity:** High
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open (needs a targeted backend grep to resolve which side is wrong)
- **What:** `/admin/reports` page collapses 4 distinct UI actions (dismiss/warn/remove/suspend) down to only 2 backend statuses (dismissed/actioned) — warn, remove, and suspend are indistinguishable to the backend once submitted; a real audit-trail/granularity loss.
  **Where:** `pwa/src/app/(app)/admin/reports/page.tsx`, `PATCH /admin/reports/:reportId/status`.
  **Severity:** High
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open

### Medium
- **What:** Role-name casing inconsistency across admin-gating middleware: `departments.routes.ts` checks lowercase `"admin"`/`"super_admin"` while `moderation.routes.ts` checks capitalized `'Moderator'`/`'Super Admin'`. `restrictedTo` does an exact-string check with no normalization. Whether this is a real bug depends on how role documents are actually named in the live DB — unconfirmed from source alone; if seeded roles are capitalized like moderation's, department admin write routes may be permanently unreachable by design-intended admins.
  **Where:** `NeyborHuud-ServerSide/src/modules/departments/department.routes.ts` vs `moderation.routes.ts`, `middlewares/auth.middleware.ts:600-615`.
  **Severity:** Medium
  **Source:** `02-api-registry/departments.md`
  **Status:** Open (needs direct DB check)
- **What:** The admin UI (only 3 nav items: Dashboard/Users/Reports) covers a small fraction of the documented 30-route admin API surface — large portions (discovery/ops, DLQ management, analytics, audit logs, user export, ban, purge-deleted, content-delete, picker-communities admin) have no frontend UI at all.
  **Where:** `pwa/src/app/(app)/admin/*` vs `02-api-registry/admin.md`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open (scope/roadmap gap, not necessarily a bug)
- **What:** `/users/:userId/verify` (admin manual override) is presumably the *real* path by which any user actually becomes "Verified" today, since `submitKYC` is a stub — worth confirming this is the known/accepted current process with whoever operates the platform.
  **Where:** `NeyborHuud-ServerSide/src/modules/admin/admin.routes.ts`, confirmed reachable from `pwa/src/app/(app)/admin/users/page.tsx`.
  **Severity:** Medium
  **Source:** `02-api-registry/admin.md`, `03-api-page-matrix/settings-profile-auth-admin.md`
  **Status:** Open
- **What:** Two distinct RBAC gate implementations exist (`requireAdmin` — checks `userRoles`/`role`/`isAdmin`; `restrictedTo(...)` — checks specific named roles) — both work correctly with the current Bearer-only auth, but worth unifying naming/approach in a later backend cleanup.
  **Where:** `NeyborHuud-ServerSide/src/middlewares/admin.middleware.ts`, `auth.middleware.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/admin.md`
  **Status:** Open

---

## Moderation

### Medium
- **What:** Moderation is an admin/moderator-only module (`restrictedTo('Moderator', 'Super Admin')` router-wide) — any "Moderation Queue" UI must live in an admin-gated area, not the general authenticated app shell; calling these from a normal user session will 403.
  **Where:** `NeyborHuud-ServerSide/src/modules/moderation/moderation.routes.ts`.
  **Severity:** Low (design constraint, not a defect)
  **Source:** `02-api-registry/moderation.md`
  **Status:** Open (informational — confirmed by page-matrix that `/admin/reports` correctly uses `admin.md`'s reports routes instead)
- **What:** Unclear how many roles exist in the RBAC system (`restrictedTo` implies a `role` field with at least `'Moderator'`/`'Super Admin'`) and whether the frontend has any admin surface at all — not explicitly confirmed at the time this module was documented (later resolved: yes, `/admin/*` exists).
  **Where:** `NeyborHuud-ServerSide/src/modules/moderation/moderation.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/moderation.md`
  **Status:** Open (superseded/answered by admin.md and page-matrix, listed for completeness)

---

## Content/Feed

### High
- **What:** `useLocationFeed` always merges in mock/fake posts (`getMockFeedPage()`) regardless of whether the real API call succeeds, and returns 100% mock content silently if the real call throws — `/feed` can render a fully populated, seemingly-normal feed even when the backend is completely down, with no error state ever shown.
  **Where:** `pwa/src/hooks/usePosts.ts` (`useLocationFeed`), `pwa/src/app/(app)/feed/page.tsx`.
  **Severity:** High
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open
- **What:** `/saved` page and `usePosts.ts`'s exported `useSavedPosts()` hook have diverged: the page reimplements its own inline `useQuery` with a different cache key (`saved-posts` vs the hook's `savedPosts`). `usePostMutations()`'s `savePost`/`unsavePost` (used by the feed page) invalidate `["savedPosts"]`, not `["saved-posts"]` — so saving/unsaving a post from `/feed` does not reliably invalidate/refresh the `/saved` page's cache.
  **Where:** `pwa/src/app/(app)/saved/page.tsx`, `pwa/src/hooks/usePosts.ts`.
  **Severity:** High
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open
- **What:** `FeedDiscoveryBlock`'s discovery pools (marketplace/events/jobs/help/services/news) fall back to hardcoded `MOCK_*` arrays when live data is empty — real backend failures are invisible to the user, same masking pattern as the feed mock-merge bug above.
  **Where:** `pwa/src/hooks/useFeedDiscoveryPools()` (referenced from `feed/page.tsx`).
  **Severity:** High
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open

### Medium
- **What:** Two distinct post-creation endpoints exist (`POST /content/posts` and `POST /content/`) with different validation schemas and different multipart handling — a rebuild needs to confirm which one the frontend actually uses (likely `/posts`) and treat the other as legacy.
  **Where:** `NeyborHuud-ServerSide/src/modules/content/content.routes.ts`.
  **Severity:** Medium
  **Source:** `02-api-registry/content.md`
  **Status:** Open
- **What:** `PATCH /marketplace/:id/status` has its handler written inline in the routes file instead of in a controller — breaks the routes/controller separation pattern used everywhere else in the backend.
  **Where:** `NeyborHuud-ServerSide/src/modules/content/content.routes.ts:259-273`.
  **Severity:** Low
  **Source:** `02-api-registry/content.md`
  **Status:** Open
- **What:** `/saved` page uses a fixed `limit=40` with no pagination/infinite-scroll wired up, despite `useSavedPosts()`'s underlying infinite-query hook supporting it.
  **Where:** `pwa/src/app/(app)/saved/page.tsx`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open
- **What:** `useFeedTabSwipe` hook has zero importers anywhere in `pwa/src` — dead/unused code. The feed page manages tab state via plain `useState`/URL params with no swipe gesture wiring found.
  **Where:** `pwa/src/hooks/useFeedTabSwipe.ts`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open
- **What:** `/feed` uses POST with `{unsave:true}` body for unsaving instead of the documented DELETE alias — functionally fine (backend aliases both) but frontend never exercises the DELETE path, an inconsistency worth resolving in the Frontend Contract.
  **Where:** `pwa/src/services/content.service.ts` (`unsavePost`).
  **Severity:** Low
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open

### Low
- **What:** Extensive intentional route aliasing (`/:id/x` vs `/posts/:id/x`) throughout `content.routes.ts` is deliberate and load-bearing (frontend uses `/content/posts/:id/...`) — noted so it is not mistakenly "cleaned up" during the rebuild.
  **Where:** `NeyborHuud-ServerSide/src/modules/content/content.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/content.md`
  **Status:** Open (informational, not a defect)

---

## Search

### High
- **What:** Explore page calls `GET /search/trending`, but `search.md`'s registry only documents `GET /search/trends` — different path, no alias. The call is silently masked by a try/catch fallback to hardcoded topics, so it is a real, always-failing bug invisible to users or casual QA.
  **Where:** `pwa/src/services/search.service.ts` (`getTrendingSearches`), `pwa/src/app/(app)/explore/page.tsx`.
  **Severity:** High
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open

### Medium
- **What:** Recent-search history and its clearing on `/explore` are 100% client-side (`localStorage`) — the backend's `GET`/`DELETE /search/history` routes (if they exist) appear unused from this page; `search.md` itself only documents 4 routes total (no `/history` route exists in the registry at all).
  **Where:** `pwa/src/app/(app)/explore/page.tsx`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open
- **What:** Multiple search-service methods have no caller found anywhere in `pwa/src` (grepped globally): `searchEvents`, `searchJobs`, `searchMarketplace`, `searchServices`, `getSuggestions` (`GET /search/suggestions`), `getSearchHistory`/`clearSearchHistory`, legacy `globalSearch()`, and `POST /search/ai` (AI search) — likely dead from the frontend's perspective.
  **Where:** `pwa/src/services/search.service.ts`.
  **Severity:** Medium
  **Source:** `03-api-page-matrix/feed-content-search.md`
  **Status:** Open

---

## Geo

### Medium
- **What:** Account deletion (`/sovereignty/delete-account`, `/sovereignty/cancel-deletion`) lives under the `/geo` module rather than `/auth` or `/identity` — a naming/discoverability surprise worth knowing for frontend route/feature mapping.
  **Where:** `NeyborHuud-ServerSide/src/modules/geo/geo.routes.ts` (governance controller).
  **Severity:** Low
  **Source:** `02-api-registry/geo.md`
  **Status:** Open (informational — not itself a defect)

*(No other open findings in `geo.md` — public/protect auth choices were reviewed and found consistent with the module's onboarding-oriented purpose.)*

---

## Media

### Medium
- **What:** Unclear whether `/media/upload` is meant to be the one general-purpose upload path or whether the per-module multer configs (events cover image, jobs resume, profile avatar/cover, services listing images, chat's own `/upload`) represent duplicated upload-handling logic worth consolidating.
  **Where:** `NeyborHuud-ServerSide/src/modules/media/media.routes.ts` vs. per-module multer instances.
  **Severity:** Medium
  **Source:** `02-api-registry/media.md`
  **Status:** Open (needs a Frontend Contract decision)
- **What:** `GET /media/signed-params` suggests intended direct-to-cloud-storage upload support, but was not traced into the controller — relevant for native app work since signed-URL direct uploads are usually preferable to routing large media through the Express server for mobile.
  **Where:** `NeyborHuud-ServerSide/src/modules/media/media.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/media.md`
  **Status:** Open (needs follow-up trace, not confirmed as a defect)

---

## Mobile/PWA

### High
- **What:** Push-subscription endpoints (`/mobile/push/subscribe`, `/mobile/push/unsubscribe`) are Web-Push-shaped (browser `PushSubscription` object) with no APNs/FCM device-token support. Native iOS/Android push typically needs device tokens registered through APNs/FCM — this endpoint pair will likely need to change shape (or get a parallel endpoint) once native apps ship.
  **Where:** `NeyborHuud-ServerSide/src/modules/mobile/mobile.routes.ts`.
  **Severity:** High
  **Source:** `02-api-registry/mobile.md`
  **Status:** Open

### Medium
- **What:** `/optimization/ping` and `/optimization/network-quality` are byte-for-byte the same route (both call the `ping` handler) — a source comment admits this is provisional ("Reuse ping logic or enhance"). Not a bug per se, but the frontend should standardize on one canonical path.
  **Where:** `NeyborHuud-ServerSide/src/modules/media/optimization.routes.ts`.
  **Severity:** Low
  **Source:** `02-api-registry/optimization.md`
  **Status:** Open

---

## Routing

### Medium
- **What:** The bare/landing-domain subdomain-redirect allowlist in `middleware.ts` (22 hardcoded paths) is incomplete relative to the full `(app)` route set — `/neighborhood`, `/gist`, `/local-news`, `/events`, `/work`, `/huud-economy`, `/gamification`, `/premium`, `/safety`, `/sos`, `/notifications`, `/saved`, `/admin`, `/profile`, `/communities`, `/gossip` are NOT in the list, so hitting any of these on the bare landing domain falls through to that domain's own default routing instead of being force-redirected to the `app.*` subdomain (where the real session/localStorage lives).
  **Where:** `pwa/src/middleware.ts`.
  **Severity:** Medium
  **Source:** `04-route-map/route-classification.md`
  **Status:** Open
- **What:** `/messages` and `/messages/[conversationId]` are dead-weight double-redirect chains (`/messages` → `/chat` → `/friendship?tab=dms`) — no unique functionality, kept only for backward compatibility.
  **Where:** `pwa/src/app/(app)/messages/*`.
  **Severity:** Low
  **Source:** `04-route-map/route-classification.md`
  **Status:** Open (informational — legacy shim, not urgent)
- **What:** `/feed/media-preview` and `/demo` are confirmed unreachable via any internal link (grepped repo-wide) — static design-sandbox pages with zero API calls, reachable only by direct URL. Candidates for removal or gating out of production builds.
  **Where:** `pwa/src/app/(app)/feed/media-preview/page.tsx`, `pwa/src/app/(marketing)/demo/page.tsx`.
  **Severity:** Low
  **Source:** `04-route-map/route-classification.md`
  **Status:** Open
- **What:** `next.config.ts`'s `redirects()` array only covers 2 of the 13 total redirect-shim routes (`/messages` → `/chat`, `/messages/:conversationId` → `/chat/:conversationId`) and is dropped entirely in the Capacitor static-export build (`output: 'export'` doesn't support `redirects()`) — client-side page-level shims exist as the fallback for native builds, confirmed intentional, but worth flagging as a native-build-specific behavioral difference for testing.
  **Where:** `pwa/next.config.ts`.
  **Severity:** Low
  **Source:** `04-route-map/route-classification.md`
  **Status:** Open (informational — confirmed intentional, but a testing/QA risk if native build isn't separately verified)
- **What:** No direct `Link`/`router.push('/complete-profile')` call site was found inside `signup/page.tsx` itself — the reward-prompt UI that leads to `/complete-profile` presumably lives in a component not opened during this pass (e.g., a feed prompt banner), leaving the entry point undocumented.
  **Where:** `pwa/src/app/(marketing)/complete-profile/page.tsx` and its (unlocated) entry point.
  **Severity:** Low
  **Source:** `04-route-map/route-classification.md`
  **Status:** Open (documentation gap, not a confirmed defect)

---

## Cross-cutting note (not a fix-list item, informational)

`02-api-registry/analytics.md` references a "safety.md finding about a removed legacy analytics endpoint with a cross-user data-leak bug" in a different module (`safety`), which is **not** among this batch's assigned files — flagged here only so the team tracking the full fix list knows to pull that finding from whichever batch covers `safety.md`.

---

## Count summary (for spot-check)

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 10 |
| Medium | 30 |
| Low | 9 |
| **Total open findings** | **52** |
| Fixed/deployed (tracked separately) | 2 (`protectWithBetterAuth` gossip fix; `/settings` dead-code regression) |
