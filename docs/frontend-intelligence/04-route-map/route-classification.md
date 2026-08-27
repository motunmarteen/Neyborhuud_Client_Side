# Route Classification -- Application / Route Map (Step 5)

> Definitive classification of every `page.tsx` under `pwa/src/app/`. Built on top of Step 4's
> `03-api-page-matrix/*.md` (trusted, not re-derived where already covered) plus direct source reads
> for everything Step 4 did not trace: `(marketing)` onboarding flow order, `middleware.ts`,
> `next.config.ts` `redirects()`, `/neighborhood`, `/demo`, and reachability checks via repo-wide grep.
> 105 `page.tsx` files total. Route paths below are the URL paths (route groups `(app)`/`(marketing)`
> stripped, as Next.js does at request time).

---

## 1. Full route table

| Route | Type | Auth | Redirects To | Notes |
|---|---|---|---|---|
| `/` (`app-root/page.tsx`) | real (splash/router) | public | conditional: `resolvePostAuthRoute()` if valid session, else `/login` (returning visitor) or shows landing video (first-time) | Only reachable when `middleware.ts` rewrites `app.*` subdomain's `/` to `/app-root`. Not a content page -- a session-branching splash. |
| `/admin` | real | admin-gated (`useAdminAuth`, role/isAdmin check via `GET /profile/me`) | -- | Dashboard stat cards + engagement + sparkline |
| `/admin/reports` | real | admin-gated | -- | Moderation report queue |
| `/admin/users` | real | admin-gated | -- | User management table |
| `/chat` | redirect (client) | app | `/friendship?tab=dms` (or `?tab=communities`) | Also has server `next.config` redirect only for `/messages` to `/chat`, not this route itself |
| `/chat/[conversationId]` | real, dynamic | app | -- | `[conversationId]`: chat/DM conversation id. The one live messaging surface |
| `/communities` | real | app (create/join gated; browse works signed-out) | -- | Hub community browse/join/create |
| `/communities/[id]` | real, dynamic | app | -- | `[id]`: hub community id. Detail/admin panel |
| `/communities/join/[code]` | real, dynamic | app | -- | `[code]`: invite code. Preview + join-by-code landing |
| `/community-emergency` | real | app (post requires sign-in; browse open) | -- | Community-posted emergency alerts (distinct from `/safety/emergency`) |
| `/events` | real | app | -- | Browse/filter events |
| `/events/[id]` | real, dynamic | app | -- | `[id]`: event id. Detail + organizer actions |
| `/events/[id]/edit` | real, dynamic | app, organizer-only (client-side check) | -- | `[id]`: event id |
| `/events/create` | real | app, redirects to `/login` if unauthenticated | -- | |
| `/events/my-events` | real | app | -- | Attending vs organizing tabs |
| `/events/nearby` | real | app | -- | Geolocation-based |
| `/explore` | real | app | -- | Search + discovery dashboard |
| `/feed` | real | app (works partially signed-out; profile-sync redirects logged-in incomplete users) | -- | Primary infinite-scroll feed |
| `/feed/media-preview` | static (design sandbox) | app | -- | Hardcoded XPostCard sample-data preview. Zero API calls. No internal link found anywhere in pwa/src, grepped repo-wide, confirmed unreachable except by direct URL |
| `/friendship` | real | app | -- | The actual chat inbox / connect hub (chats/near_me/following/followers tabs) |
| `/fyi` | real | app | -- | Community bulletin board |
| `/gamification` | redirect (client) | app | `/huud-economy/score` (preserves `?tab=`) | Legacy rebrand shim |
| `/gamification/wallet` | redirect (client) | app | `/huud-economy/wallet` (preserves `?tab=`) | Legacy rebrand shim |
| `/gist` | real | app (browse; create is auth-gated) | -- | Live top-level Huud Gist forum |
| `/gist/[id]` | real, dynamic | app | -- | `[id]`: gist thread id |
| `/gossip` | redirect (server) | app | `/gist` | Pure redirect('/gist'), fires server-side, zero client code runs |
| `/help-request` | real | app | -- | Community help-request board |
| `/help-request/[id]` | real, dynamic | app | -- | `[id]`: help-request post id |
| `/huud-economy` | real | app | -- | Condensed dashboard (streak/stats/quick links) |
| `/huud-economy/score` | real | app | -- | Full gamification hub (5 tabs), the real "gamification" page |
| `/huud-economy/wallet` | real | app | -- | HuudCoin wallet/ledger detail |
| `/incident-reports` | real | app (browse open; create requireVerified server-side, no client pre-check) | -- | Civic incident feed |
| `/incident-reports/[id]` | real, dynamic | app | -- | `[id]`: incident report id |
| `/info/community-rules` | static | public within (app) layout | -- | Zero API calls, hardcoded legal/help text |
| `/info/nigeria-postal-codes` | static | public within (app) layout | -- | Zero API calls |
| `/info/privacy-policy` | static | public within (app) layout | -- | Zero API calls |
| `/info/terms-of-service` | static | public within (app) layout | -- | Zero API calls |
| `/jobs` | real | app | -- | Browse/filter job postings |
| `/jobs/[id]` | real, dynamic | app | -- | `[id]`: job posting id. Has confirmed-dead "Close Job" button (backend route doesn't exist) |
| `/jobs/create` | real | app, redirects to `/login` if unauthenticated | -- | |
| `/jobs/my-applications` | real | app | -- | |
| `/jobs/saved` | real | app | -- | |
| `/local-news` | real | app | -- | RSS news reader; embeds a legacy Gist tab that itself redirects |
| `/local-news/[id]` | redirect (client) | app | `/gist/[id]` | [id] param passed through. router.replace, renders nothing |
| `/local-news/gist/[id]` | redirect (client) | app | `/gist/[id]` | Same pattern, different legacy URL shape |
| `/map` | real | app (own-location publish requires GPS permission, not auth) | -- | Leaflet discovery map (people/places layers) |
| `/marketplace` | real | app | -- | Browse grid; product detail is inline via `?product=` scroll-to, not a separate page |
| `/marketplace/[id]` | redirect (client) | app | `/marketplace?product={id}` | [id]: product id. No standalone detail page exists |
| `/marketplace/[id]/edit` | real, dynamic | app, owner-only | -- | [id]: product id |
| `/marketplace/create` | real | app | -- | |
| `/marketplace/my-deals` | real | app | -- | Unified buyer+seller deal list |
| `/marketplace/my-listings` | real | app | -- | |
| `/messages` | redirect (client + server) | app | `/chat` (which itself redirects to `/friendship?tab=dms`) | Client shim covers Capacitor static export; next.config.redirects() covers web build. Dead weight, no unique functionality |
| `/messages/[conversationId]` | redirect (client + server) | app | `/chat/[conversationId]` | Same dual-redirect pattern |
| `/neighborhood` | real | app | -- | "My Huud" browse: Your Huud / Street Radar / Fresh / Places tabs. This is the real destination `/popular` redirects into, traced this pass since Step 4 flagged it as out-of-scope: calls contentService.getLocationFeed() with feedTab variants (your_huud/street_radar/following_places), ranked flag for Street Radar sort. No dedicated service beyond the shared feed endpoint |
| `/notifications` | real | app | -- | Notification inbox |
| `/popular` | redirect (client) | app | `/neighborhood?tab=street-radar` (aliases legacy `?tab=hot`) | Confirmed by Step 4; target page now traced above |
| `/premium` | redirect (client) | app | `/huud-economy/wallet?tab=tier` | Legacy route, "activity tier lives in the HuudCoins wallet hub" |
| `/premium/success` | real | app | -- | HuudCoin payment verification screen. No internal link found in marketplace/jobs/services cluster, reached from wallet/boost purchase flow instead |
| `/profile/[username]` | real, dynamic | app (view public; edit-affordances only for own profile) | -- | [username]: username, serves both own and others' profiles (no separate /profile self-route exists) |
| `/profile/[username]/followers` | real, dynamic | app | -- | [username]: username. Paginated followers list |
| `/profile/[username]/following` | real, dynamic | app | -- | [username]: username. Paginated following list |
| `/safety` | real | app | -- | Sentinel feature-discovery hub |
| `/safety/dashboard` | redirect (server) | app | `/safety/manage` | Pure redirect(), no client code |
| `/safety/emergency` | real | app | -- | Legacy Emergency report/dispatch-log form |
| `/safety/fake-call` | real (zero backend calls) | app | -- | Purely client-side (Web Audio/vibration/local notification) |
| `/safety/geofences` | real | app | -- | Geofence CRUD + live map |
| `/safety/incident/[id]` | real, dynamic | app | -- | [id]: SOS event id. Post-incident recap |
| `/safety/kidnapping-tracking` | real | app, requireVerification-mirrored client gate (getLiveTrackingBlockers) | -- | Live GPS tracking session |
| `/safety/kidnapping-tracking/watch/[sessionId]` | real, dynamic | app, server-enforced guardian check (403 caught client-side) | -- | [sessionId]: tracking session id. Guardian read-only view |
| `/safety/manage` | real | app | -- | Sentinel Dashboard (guardians/circle/check-ins/status tabs) |
| `/safety/panic-pin` | real | app | -- | Set/rotate/remove duress PIN |
| `/safety/panic-pin/enter` | real (disguised UI) | app, no app-level auth gate (security-by-obscurity) | -- | Real silent-SOS trigger surface. Linked from panic-pin and practice pages/PanicPinKeypad component, reachable in-app, not purely bookmark-only as its own file comments imply |
| `/safety/panic-pin/practice` | real (simulated, zero backend calls) | app | -- | Safe rehearsal, Math.random()-driven fake outcome |
| `/safety/sentinel` | real | app | -- | AI red-zone advisories (data comes from notifications module, not safety.md) |
| `/safety/sentinel/settings` | real | app | -- | Per-user delivery-side severity filter (all/high/critical) + 0-10 sensitivity floor for Sentinel advisories; detection scoring itself is identical for everyone, this only tunes what's delivered. Calls `safety.md`'s `GET`/`PATCH /safety/settings`, same route as `/settings`'s emergency-services toggle |
| `/safety/trips` | real | app | -- | Safe Trips tabbed monitor |
| `/safety/trips/history` | real | app | -- | Paginated trip history (standalone route for the Trips page's History tab) |
| `/safety/trips/watch/[userId]` | real, dynamic | app, server-enforced guardian check | -- | [userId]: protege's user id. Guardian read-only trip view |
| `/saved` | real | app, auth-gated (sign-in CTA shown if signed out) | -- | Bookmarked posts |
| `/services` | real | app | -- | Browse service providers |
| `/services/[id]` | real, dynamic | app | -- | [id]: service id. Detail + book/rate/boost |
| `/services/create` | real | app, redirects to `/login` if unauthenticated | -- | |
| `/services/my-bookings` | real | app, redirects to `/login` if unauthenticated | -- | |
| `/services/my-favorites` | real | app | -- | |
| `/settings` | real | app | -- | Tabbed settings hub (5 tabs) |
| `/settings/blocked` | real | app | -- | Blocked-users list |
| `/settings/location` | real | app | -- | Content radius + map-pin |
| `/settings/password` | real | app | -- | |
| `/settings/payout` | real | app | -- | Seller bank payout details |
| `/settings/places` | real | app | -- | Home + frequent places |
| `/sos` | real | app, no client-side auth/verification gate (matches backend: SOS trigger intentionally not requireVerification-gated) | -- | Primary SOS command center |
| `/work` | real | app | -- | Unified Hiring/For-Hire tab shell around /jobs + /services components (same API calls, no separate surface) |
| `/complete-profile` | real (form) | marketing, requires token; redirects to `/login` if none, `/verify-email` if email unverified | see onboarding section | Not part of the mandatory onboarding chain. Optional profile-enrichment reward step, also reused as "Edit profile" entry point from Settings. Success button routes to /feed directly (not to pick-community/verify-location) |
| `/demo` | static (dev sandbox) | marketing | -- | Neumorphic UI component playground, fake weather/smart-home data, unrelated to app domain. Zero API calls; no internal link found anywhere in pwa/src, grepped repo-wide, confirmed unreachable except by direct URL |
| `/forgot-password` | real | marketing | -- | Password-reset request |
| `/login` | real | marketing | see onboarding section | Also does session-restore-and-redirect on mount |
| `/pick-community` | real | marketing, requires token (redirects `/login` if none) | see onboarding section | Also reused for "change community" from Settings (isChangingCommunity mode redirects to /settings on success instead) |
| `/reset-password` | real | marketing | -- | Consumes reset token from query string |
| `/setup-complete` | real | marketing, requires token | see onboarding section | Terminal onboarding celebration screen |
| `/signup` | real | marketing | see onboarding section | Multi-stage signup + inline email OTP verification |
| `/verify-email` | real | marketing | see onboarding section | Also reachable mid-signup and post-login for unverified accounts |
| `/verify-location` | real | marketing, requires token | see onboarding section | GPS proximity check against assigned community |
| `/welcome` | redirect (server) | marketing | `/` | Pure redirect('/'), zero UI, zero API calls. Dead route kept only for old links |

---

## 2. Onboarding flow order

Traced directly from each page's own redirect/gate logic in pwa/src/app/(marketing)/** and the shared
helpers pwa/src/lib/authSession.ts (resolvePostVerifyRoute, resolvePostAuthRoute) and
pwa/src/lib/onboarding.ts (getPostSetupRoute, hasCompletedProductTour).

### Canonical new-user path

```
/signup  (multi-stage form: location -> identity -> security)
   |  POST /auth/create-account
   v
/signup [step="verify-email"]  (inline OTP, same page, no route change)
   |  POST /auth/verify-email
   |  advanceAfterVerified() -> resolvePostVerifyRoute():
   |    - if needsCommunitySelection -> push /pick-community
   |    - else if needsGpsLocationVerification -> push /verify-location
   |    - else -> setStep('success')  (stays on /signup, shows in-page success screen)
   v
/pick-community   (only if community not yet assigned)
   |  POST /auth/confirm-community
   |  if needsGpsLocationVerification -> replace /verify-location
   |  else -> replace getPostSetupRoute() = /setup-complete
   v
/verify-location   (only if GPS verification still required)
   |  POST /geo/communities/:id/verify
   |  on success -> replace getPostSetupRoute() = /setup-complete
   v
/setup-complete
   |  gate checks on mount (in order): needsCommunitySelection -> /pick-community (bounce back)
   |                                    needsGpsLocationVerification -> /verify-location (bounce back)
   |                                    hasCompletedProductTour() -> /feed (already onboarded, skip)
   |  otherwise: markProductTourComplete(); shows celebration screen
   |  "Enter my Huud" button -> push /feed
   v
/feed
```

### Returning / already-onboarded user path

`/` (app-root) and `/login` both call resolvePostAuthRoute(next) on a valid session, which re-runs the
same two gates before falling through to /feed:
1. needsCommunitySelection -> /pick-community
2. needsGpsLocationVerification -> /verify-location
3. else -> ?next= param if same-origin-safe, else /feed (or getPostSetupRoute() = /setup-complete
   if the product tour was never marked complete -- covers legacy accounts created before the tour flag
   existed, but resolvePostAuthRoute treats "already has a stored community" as tour-complete and
   sends straight to /feed; only truly-new/incomplete sessions land on /setup-complete).

### /complete-profile -- explicitly NOT in this chain

/complete-profile's guards only check for a valid token (redirects to /login if absent) and a verified
email (redirects to /verify-email if not). It is never auto-inserted between /verify-email and
/pick-community by any gate function. It is reached two ways: (a) a manual link from a profile-enrichment
reward prompt somewhere in the app shell (component not opened this pass, see Unknowns), and (b) reused
as the "Edit profile" screen from /settings. Its own success action routes straight to /feed, bypassing
pick-community/verify-location entirely (those are resolved independently, by their own gates, whenever
the user does hit /feed or /setup-complete).

### /verify-email reachability outside signup

Independently reachable (not only via the inline signup step): direct link visit with ?token= (auto-verify
on mount) or manual 6-digit code entry; also the redirect target from /complete-profile and
getLiveTrackingBlockers() (Safety cluster) when an unverified user attempts a gated action.

---

## 3. Redirect shims

All redirect-only pages found across the entire route list (client-side router.replace/router.push in a
useEffect with no rendered UI, or a server-side redirect()):

| Route | Mechanism | Destination | Also has server next.config redirect? |
|---|---|---|---|
| `/chat` | client (useEffect + router.replace) | `/friendship?tab=dms` or `?tab=communities` | No |
| `/messages` | client + server | `/chat` | Yes, next.config.redirects(), web build only |
| `/messages/[conversationId]` | client + server | `/chat/[conversationId]` | Yes, next.config.redirects(), web build only |
| `/gamification` | client | `/huud-economy/score` (preserves ?tab=) | No |
| `/gamification/wallet` | client | `/huud-economy/wallet` (preserves ?tab=) | No |
| `/popular` | client | `/neighborhood?tab=street-radar` | No |
| `/premium` | client | `/huud-economy/wallet?tab=tier` | No |
| `/marketplace/[id]` | client | `/marketplace?product={id}` | No |
| `/gossip` | server (redirect()) | `/gist` | No, fires before any client code |
| `/local-news/[id]` | client | `/gist/[id]` | No |
| `/local-news/gist/[id]` | client | `/gist/[id]` | No |
| `/safety/dashboard` | server (redirect()) | `/safety/manage` | No |
| `/welcome` | server (redirect()) | `/` | No |

Total: 13 redirect-only routes out of 105 real files. next.config.ts's redirects() array itself only
covers 2 of these (/messages to /chat, /messages/:conversationId to /chat/:conversationId) and is dropped
entirely in the Capacitor static export build (output: 'export' doesn't support redirects()), which is
exactly why the client-side page-level shims exist for those two routes as a fallback for native builds,
confirmed directly from the next.config.ts comment and the IS_CAP branching.

---

## 4. middleware.ts findings

Verified directly from pwa/src/middleware.ts (86 lines, current as of this pass, the file's own logic,
not assumed from the Step 1 audit).

Two-domain split, host-based, not path-based:

1. app.* subdomain (app.neyborhuud.com, app.localhost, app.neyborhuud.local): the PWA/app shell lives
   here. The only special-case behavior: if the request path is exactly /, the middleware rewrites (not
   redirects, URL bar stays the same) it internally to /app-root, which is the file that does the
   session-check/landing-splash logic described in section 2 above. No other subdomain rewriting occurs
   for this host.

2. Bare/landing domain (neyborhuud.com, neyborhuud.local, or anything not matching the app. prefix
   check): if the request path matches (exactly or as a prefix) one of a hardcoded list of 22 "PWA paths"
   (/feed, /chat, /marketplace, /explore, /map, /jobs, /services, /community-emergency, /fyi,
   /help-request, /incident-reports, /friendship, /settings, /login, /signup, /forgot-password,
   /reset-password, /verify-email, /auth-callback, /setup-complete, /pick-community, /verify-location,
   /complete-profile), the middleware issues a real HTTP redirect (NextResponse.redirect, not a rewrite)
   to the same path on app.neyborhuud.com (or the local equivalent, computed by string-replacing the
   hostname). The in-code comment explains why even auth/onboarding routes are included in this list: the
   whole account session is scoped to the app.* origin's own localStorage, so letting any part of signup
   run on the bare landing host would produce a session /feed etc. can never see once the user crosses to
   app.*.
   - Gap observed, not present in the hardcoded list: /neighborhood, /gist, /local-news, /events, /work,
     /huud-economy, /gamification, /premium, /safety, /sos, /notifications, /saved, /admin, /profile,
     /communities, /gossip are not in this 22-entry allowlist (/jobs IS present). Any of these paths hit
     on the bare landing domain will fall through to NextResponse.next() (default Next.js routing on that
     host) rather than being redirected to app.*, worth flagging as a likely-incomplete list if the intent
     is "every PWA route should force the app subdomain." Not fixed here, just verified as the current
     literal behavior.
   - If the bare-domain request path does not match the list, NextResponse.next(), the landing marketing
     site's own pages (root /, static content) render normally on the bare domain.

3. Matcher config: excludes api, _next/static, _next/image, favicon.ico, and several static file
   extensions (.png, .jpg, .mp4, .svg, .json, manifest.webmanifest) from the middleware entirely, those
   always pass through untouched regardless of host.

This is a straightforward confirmation of what Step 1's audit flagged as "exists, treat as unverified":
the subdomain-redirect behavior is real, current, and matches the description above; the only refinement
beyond a cursory read is the specific 22-path allowlist and the observation that it does not cover every
real (app) route.

---

## 5. Unknowns

- ~~/safety/sentinel/settings~~ **Resolved.** Real, content-bearing page (236 lines), no redirect.
  Auth-gated (inside `(app)`). Calls `safetyService.getSafetySettings()` / `updateSafetySettings()`,
  which map to `safety.md`'s `GET`/`PATCH /safety/settings` — the same route the `/settings` page's
  "Emergency services" toggle also hits (confirmed cross-reference: this page even links back to
  `/settings` for that specific toggle, explicitly saying it lives there instead of duplicating it
  here). Lets a user set a per-user delivery-side severity filter and a 0-10 sensitivity floor for
  Sentinel red-zone advisories — explicitly NOT a detection-tuning control (the page's own top-of-file
  comment is emphatic that detection scoring is identical for every user in an LGA; these settings only
  change what gets delivered to the individual). Also surfaces the "Include my work area" toggle
  (`redZoneWorkAreaEnabled`). No dead code, no unmatched calls.
- Several cross-cluster "unmatched call" findings are already logged in the six 03-api-page-matrix files
  and intentionally not re-litigated here, this document only adds routing-level facts those files didn't
  already cover.
- Whether /complete-profile is ever linked from a specific in-app prompt/banner: grep confirms it's
  linked from /settings, auth.service.ts, middleware.ts (path-list only), appShellGates.ts,
  FloatingSosButton.tsx, and safetyEligibility.ts (as a gap-remediation deep link with ?focus=phone), but
  no direct Link/router.push('/complete-profile') call site was found inside signup/page.tsx itself, the
  reward-prompt UI that leads here presumably lives in a component not opened this pass (e.g. a feed
  prompt banner). Flagged, not fabricated.
- Exact production hostnames beyond what's hardcoded in middleware.ts (e.g. any CDN/preview-deploy
  domains) were not investigated, only the literal string logic in the file was verified.

---

## Summary

Classified all 105 page.tsx files. 13 are pure redirect shims (client and/or server), 6 are static or
informational pages with zero API calls (/info/* legal pages, /demo sandbox, /feed/media-preview design
preview, the latter two confirmed unreachable via any internal link), and the remaining roughly 86 are
real content pages, the large majority auth-gated inside the (app) route group. Traced the exact
onboarding sequence from source: /signup -> inline email OTP -> /pick-community (if needed) ->
/verify-location (if needed) -> /setup-complete -> /feed, with /complete-profile confirmed to sit outside
this mandatory chain as an optional reward/edit-profile screen, not a forced step. Verified middleware.ts
directly: it rewrites app.*'s bare / to /app-root and force-redirects a hardcoded 22-path allowlist from
the bare landing domain to app.*, but that allowlist is incomplete relative to the full (app) route set —
paths like /gist, /events, /huud-economy, /sos, /admin, and /profile aren't in it, so hitting them on the
bare landing domain falls through to that domain's own routing instead of forcing the app subdomain.
/safety/sentinel/settings (initially unresolved) was opened in a follow-up check: real, working page,
per-user Sentinel delivery-filter settings, no issues found.
