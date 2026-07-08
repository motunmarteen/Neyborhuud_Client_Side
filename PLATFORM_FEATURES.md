# NeyborHuud Platform — Feature Catalog (Frontend / PWA)

> Generated 2026-07-06 by full-repo audit. Companion doc: [PLATFORM_FEATURES.md in NeyborHuud-ServerSide](../NeyborHuud-ServerSide/PLATFORM_FEATURES.md) (backend catalog, cross-linked to this one).
>
> Purpose: a single source of truth for **every** page/feature in the PWA, its wiring status against the backend, and what's left to build. Status legend:
> - ✅ **Live** — built and wired to a real backend endpoint
> - ⚠️ **Partial** — built but with a known gap (disabled button, missing polish, stale doc)
> - 🚧 **Coming Soon** — explicitly disabled/placeholder in the UI
> - ❌ **Not built** — referenced in docs/backend but no frontend surface exists yet

Stack: pnpm monorepo, app in `pwa/` (Next.js 16, React 19, Tailwind v4), deployed on Vercel (`app.neyborhuud.com`), plus a Capacitor-wrapped Android build. Backend: `api.neyborhuud.com/api/v1` — see [[backend: full route inventory]].

---

## 0. Routing architecture

Two route groups: `(app)` (authenticated shell, ~90 pages) and `(marketing)` (auth/onboarding, unauthenticated). `src/middleware.ts` handles subdomain routing — `app.neyborhuud.com` rewrites `/` → `/app-root`; marketing domain redirects PWA paths to `app.*`. Legacy top-level route dirs (`community-emergency`, `events`, `explore`, `feed`, `friendship`, `fyi`, `help-request`, `incident-reports`, `jobs`, `map`, `marketplace`, `services`) are stale leftovers from before the route-group split — safe to ignore/clean up.

---

## 1. Auth / Onboarding — ✅ Live

Pages: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email` (6-digit OTP), `/verify-location`, `/complete-profile`, `/pick-community`, `/setup-complete`, `/onboarding`, `/auth-callback` (Google OAuth), `/welcome`, `/demo`.

Confirmed wired: check-email/username, create-account, resend/verify-email (dual new-OTP + legacy-token), forgot/reset-password, settings/notifications, settings/privacy — matches [[backend §1: Auth & Account Management]].

**Gap:**
- 🚧 **Two-Factor Auth** — disabled "Coming Soon" button in Settings → Security (`src/app/(app)/settings/page.tsx:1412-1418`). No backend 2FA endpoints exist either — two-sided gap.

---

## 2. Feed / Social content — ✅ Live, core pillar

3-tab feed (`your_huud`, `street_radar`, `following_places`) matching [[backend §2: Feed/Content]]. Category filters incl. legacy `gossip` (redirects to `/gist`).

Rich "premium redesign" components: radial category dial, PULSE news ticker, Sentinel safety row, feed discovery-pool blending, repost/quote chains, comment threads with optimistic updates.

**Sub-pillars, all with dedicated pages/components/hooks/services:**
- **Gist/Gossip** (`/gist`) — matches [[backend §4: Gossip/HuudGist]]
- **FYI** (`/fyi`) — matches [[backend §3: FYI Bulletins]]
- **Help Request** (`/help-request`) — matches backend help-request flow in §2
- **Local News** (`/local-news`) — matches [[backend §32: News]]
- **Incident Reports** (`/incident-reports`) — matches [[backend §22: Incident Reports]]
- **Popular / Explore / Saved / Global Search**

**Gaps:**
- 🚧 "Pay with HuudCoins" for help requests — disabled "Coming Soon" (`CreateHelpRequestModal.tsx:339`, `help-request/[id]/PageClient.tsx:358`)
- ⚠️ Global Search — implemented but explicit unimplemented "optional enhancements": keyboard nav, infinite-scroll pagination, verified/date filters, trending searches, dedicated mobile modal — matches [[backend §25: Search — analytics also stubbed]], so this is a **two-sided gap**
- ⚠️ Per `FRONTEND_3_TAB_FEED_INTEGRATION.md`, 5 outstanding "Next UI tasks": branded emergency action buttons on post card/modal, saved-collection picker on Save, location-follow management screen, push-permission onboarding + `device/register` wiring, dedicated emergency composer hitting `POST /content/emergency`

---

## 3. Marketplace — ✅ Live, most actively developed area

Pages: `/marketplace`, `/marketplace/[id]` (+edit/offers), `/marketplace/create`, `/marketplace/my-listings`, `/marketplace/my-deals` (unified "Binance-P2P style" screen — replaces older separate my-orders/my-sales/my-offers pages).

Matches [[backend §6: Marketplace]] closely: full CRUD, like toggle, comments (rate-limited), real-time via `product:updated`/`product:commented`. Deal flow: fixed-price "Request to Buy" vs. negotiable "Make Offer" → Accept/Counter/Reject → Complete Purchase, all reflected in-chat via `OfferCard`/`EscrowCard` (Escrow Bot milestone cards).

Seller tier + vouch badge UI matches [[backend: sellerTier.ts]]. Payout details (bank account) captured in Settings, matches backend anti-fraud payout check.

**Gaps:**
- ⚠️ `MARKETPLACE_TESTING_CHECKLIST.md` — QA pass across CRUD/likes/comments/discovery/location/mobile/error-handling/real-time/accessibility/visual/browser-compat sections is **entirely unchecked** — reads as a pending manual QA pass, not confirmed-broken
- ❌ No payment-gateway UI — matches [[backend §6/§7: no fiat gateway]], all commerce is HuudCoin + off-platform bank transfer, by design
- `MARKETPLACE_BUYER_INTENT_FRONTEND.md` is stale on page routing (references old my-orders/my-sales/my-offers) though the backend contract it describes is still accurate

---

## 4. Chat / Messaging — ✅ Live, mature

Pages: `/chat`, `/chat/[conversationId]` (`/messages*` redirects here).

Matches [[backend §9b: Real messaging system]] closely — conversations, send/edit/delete messages, reactions, incognito invite, community calls, read/delivered/mute, groups, media upload, E2EE key management (registration/fingerprint/verify — encryption itself is client-side).

**Calling** (WebRTC voice/video, embedded in chat): full signaling matches [[backend §10: Audio/Video Calling]], including mutual-follow enforcement. Push notifications handle `incoming_call` specially (accept/decline actions in service worker).

No explicit "not done" markers found beyond marketplace payment gaps noted above — this pillar looks complete on both sides.

---

## 5. Communities / Neighborhoods — ✅ Live

Pages: `/communities`, `/communities/join[/code]`, `/neighborhood`. Matches [[backend §17: Geo/Communities]] and [[backend §18: Hub Communities]].

**Gap:**
- 🧪 Backend governance/proposals (§17) and Hub Community admin panel — frontend has `CommunityHubAdminPanel` component but backend governance (proposals/voting) is a non-functional stub, so any UI surfacing community voting would be **hitting dead backend code** — confirm before building further here.

---

## 6. Events — ✅ Live

Pages: `/events`, `/events/[id]` (+edit), `/events/create`, `/events/my-events`, `/events/nearby`. Matches [[backend §5: Events]] including recently-added comments.

---

## 7. Jobs & Services — ✅ Live

Jobs pages: `/jobs`, `/jobs/[id]`, `/jobs/create`, `/jobs/my-applications`, `/jobs/saved`. Matches [[backend §20: Jobs]].
⚠️ Backend has two duplicate Job schemas (`Common.ts` vs `Jobs.ts`) — if frontend fields ever mismatch what's returned, check which schema is actually serving `/jobs` routes.

Services pages: `/services`, `/services/[id]`, `/services/create`, `/services/my-bookings`, `/services/my-favorites`. Matches [[backend §21: Services]].

`/work` — combined jobs+services landing hub.

---

## 8. Gamification / HuudCoin Economy — ✅ Live, ⚠️ route duplication

Pages: `/gamification`, `/gamification/wallet` **and** `/huud-economy`, `/huud-economy/score`, `/huud-economy/wallet` — two overlapping route trees exist simultaneously, likely a rebrand-in-progress. Matches [[backend §14: Gamification/Trust]].

Components cover achievements, badges, boost, coin-spend, daily check-in, HuudCoin tier panel, leaderboard, streaks, tipping.

**Gap:**
- 🚧 HuudCoins not yet exchangeable for cash/Naira — "Coming Soon" in Help Request and Marketplace payment flows (see above); `local-huud-hub.ts:108` notes "HuudCoins rewards coming soon for helpers"
- **Recommend consolidating** `/gamification` and `/huud-economy` route trees — worth a product decision on which name/URL structure is final

---

## 9. Safety / "Sentinel" — ✅ Live, largest & most mature pillar (matches backend)

Pages: `/safety` hub + dashboard/emergency/fake-call/geofences/incident/[id]/kidnapping-tracking/manage/panic-pin/sentinel/trips(+history/watch), `/sos`, `/community-emergency`.

Huge dedicated component subtree (`src/components/sentinel/`) covering Hub, Dashboard, SOS (long-press trigger, drill/test mode), Live Tracking, Trips ("watch me get home"), Geofence map, Panic PIN, Fake Call decoy.

Global state: `SosContext` (single app-wide SOS state machine) + `GuardianAlertsContext`, matching the extensive socket surface in [[backend §8: Safety/SOS]] almost event-for-event.

Push notifications specially handle all safety event types (`sos_*`, `trip_*`, `guardian_*`, `geofence_alert`) with `requireInteraction` + distinct vibration + action buttons.

**This is the most heavily built-out pillar on both sides** — no significant gaps found beyond the backend-side mock-mode agency dispatch (§8 backend doc) and cell-tower-triangulation stub, which are invisible to the frontend (it just calls the same endpoints regardless of mock/real mode).

---

## 10. Profile / Social graph — ✅ Live, ⚠️ known SSR fragility

Pages: `/profile/[username]` (+followers/following) — recently redesigned into tab-scroll sections (Overview/Posts/Trust/Listings/Saved/Economy/Radar). Matches [[backend §16: Profile]] and [[backend §15: Follow/Block]].

**Friendship/Connect hub** (`/friendship`) — separate from `/profile`: call log, chats stream, connect map, friendship chat inbox.

**Known issue (fixed):** `/profile/[username]` had to be forced to client-only rendering to stop a Vercel 500 — SSR/hydration fragility noted historically, resolved via `ssr:false` boundary.

**Gap tie-in:** [[backend §15: Connections vs Follow/Block]] — backend has a separate legacy Connections system; unclear if `/friendship` uses Follow/Block or the older Connections API — worth confirming to avoid building against dead backend code.

---

## 11. Notifications — ✅ Live, ⚠️ one wiring gap to verify

Page: `/notifications`. Matches [[backend §11: Notifications]] — unread count, list/filter, mark-read/mark-all/delete, push subscribe.

**Gap:** `FRONTEND_3_TAB_FEED_INTEGRATION.md` lists "add push-permission onboarding on web and register the push token through `auth/device/register`" as a pending "Next UI task" (doc dated ~April) — `usePushNotifications` hook exists now; **verify it actually calls `device/register`** rather than assuming the doc is stale.

---

## 12. Maps / Location — ✅ Live, ⚠️ native-build gap

Page: `/map`. Matches [[backend §17: Geo]] (reverse-geocode, nearby users/places).

Internal Next.js API proxy routes (`/api/geocode/reverse`, `/api/geocode/search`) dodge CORS with Nominatim server-side.

**Gap:**
- ⚠️ These 3 proxy routes **vanish in the Capacitor static-export build** (no Node server in native app) — per the mobile audit, they're slated to move to the Express backend (`/api/v1/geo/nominatim/*`). Unclear from either repo whether this migration has actually happened — **treat as an open gap for the native Android app specifically**, not the web PWA.

Recent improvement: signup-time location is now cached/reused instead of re-prompting GPS repeatedly.

---

## 13. Premium / Payments — ✅ Live (HuudCoin-scoped)

Pages: `/premium`, `/premium/success`. Matches [[backend §7: HuudCoin Payments]] — this is HuudCoin spend, not a fiat payment gateway (none exists backend-side either).

⚠️ Minor duplication: two `PremiumCards` components exist (`components/PremiumCards.tsx` and `components/ui/PremiumCards.tsx`) — cleanup candidate, not a functional gap.

---

## 14. Settings — ✅ Live

Account, Security (incl. 🚧 2FA Coming Soon), Data & Privacy, notification/privacy toggles, Danger Zone (delete account). Matches [[backend §1: Auth settings]].

**Data Export** (NDPR compliance) — fully wired (ZIP/JSON/CSV + email-me), matches [[backend §1: export-data]].

**Gap:**
- ⚠️ `MediaDownloadButton` component exists but **not yet wired into individual post/content components** for per-post media download — explicitly noted as "add when you're ready" in `FRONTEND_DATA_EXPORT_INTEGRATION.md`

Multi-language scaffolding: en/ha/yo/ig/pcm via `src/lib/i18n.tsx`, matches [[backend §35: i18n]].

---

## 15. Admin — ⚠️ Thinnest area relative to platform size

Pages: `/admin` (dashboard), `/admin/reports`, `/admin/users` — only 2 sub-pages vs. dozens elsewhere in the app.

**Gap (two-sided):** Matches [[backend §28: Admin — analytics stub]] — backend admin analytics for SOS/marketplace-offer/trip counts always return 0 due to placeholder models. Even if frontend built richer admin UI, several stats would show zero until the backend placeholders are replaced with real models.

---

## 16. Info / Legal — ✅ Live

`/info/community-rules`, `/info/nigeria-postal-codes`, `/info/privacy-policy`, `/info/terms-of-service`. Static/simple, no gaps.

---

## Cross-cutting infrastructure

- **State management:** No Redux/Zustand — React Query for server state, narrowly-scoped React Context for global client state (`SosContext`, `GuardianAlertsContext`, `SwipeBackContext`, `CallProvider`).
- **Socket:** Singleton client wrapper, auto re-auth on reconnect, matches the full backend socket event inventory closely (see per-pillar sections above).
- **Custom swipe-back gesture system** — iOS-style swipe-to-go-back implemented in JS, notable engineering effort, no native equivalent needed.
- **Theming:** light/dark sync, brand style tokens.

---

## PWA-specific — ✅ Live, hardened after real incidents

- **Service worker:** custom push handler with per-type deep-link routing (`sos_*`, `trip_*`, `guardian_*`, `geofence_alert`, `message*`, `community_post`, `marketplace`), `requireInteraction` + vibration patterns for safety/call types.
- **Cache strategy:** NetworkFirst for HTML/JS/CSS (deliberately chosen after real production incidents with stale bundles — see `BRAND_UI_VERSION` kill-switch in `src/lib/brand.ts`, bumped repeatedly in incident-response commits), StaleWhileRevalidate for images/fonts.
- **Install prompt:** standard `beforeinstallprompt` flow.
- **Offline:** `useOfflineQueue` — ⚠️ **only wired for Safety/Trips location updates**, not a general offline-first architecture for posts/marketplace/chat. If "works fully offline" is a platform goal, this is a real gap.

---

## Mobile / Capacitor (Android) — ⚠️ Partial, several named gaps

Real Capacitor-wrapped Android app (`com.neyborhuud.app`), Android-first (iOS explicitly deferred).

**Installed native plugins:** app (lifecycle/back-button), camera, geolocation, haptics, network, preferences (secure token storage), share, splash-screen, status-bar.

**Named gaps (from the project's own mobile audit docs):**
- ❌ **No `@capacitor/push-notifications` (FCM)** — native Android push has no path; only Web Push (VAPID) exists. Open question: does the backend expose an FCM-capable endpoint, or only Web Push? Per backend audit, **only Web Push exists** (§11/§12) — so this is a real, unresolved gap requiring backend work too if native push is wanted.
- ❌ **No deep linking** (`appUrlOpen`) — flagged "must build."
- ❌ **No biometric auth** — flagged optional/not done.
- ⚠️ **Release signing not done** — "requires a signing keystore, not done yet" per `03-ANDROID-RUNBOOK.md`.
- ✅ Secure token storage (top audit recommendation) — appears implemented since (`secureToken.ts`, `CapacitorInit.tsx`).

---

## Testing coverage — ⚠️ Thin relative to app size

Vitest configured; actual unit tests concentrated almost entirely on **auth/navigation/brand utility logic** (`authSession`, `brand-styles`, `frequentPlaceContext`, `navigateBack`, `signupSheetSnap`, `swipeBackGesture`, `userProfileFields`, `userVerification`, `verificationIdentity`) plus 2-3 component tests. **Essentially no test coverage on Marketplace, Chat, Safety/Sentinel, or Gamification** despite those being the largest, most actively-developed feature areas on both frontend and backend. Ad-hoc devtools/Playwright-style QA scripts exist (`qa-auth-funnel.mjs`, `qa-auth-live.mjs`) but no CI-integrated e2e suite.

---

## Master TODO / Gap List (highest priority first)

Cross-referenced against [[backend: Master TODO list]] — items marked **(two-sided)** need both frontend and backend work:

1. **Identity/KYC verification (two-sided)** — backend §13 is entirely fake; no frontend UI gap per se, but any "Verified" badge/claim in the UI is currently backed by fake data client can't see.
2. **Native push notifications (two-sided)** — no FCM plugin frontend, no FCM-capable endpoint backend, only Web Push exists end-to-end.
3. **Two-Factor Auth (two-sided)** — disabled in UI, no backend endpoints.
4. **HuudCoin-as-real-currency (two-sided)** — "Coming Soon" in 2+ UI spots; backend has no fiat gateway at all (by design, per escrow model) — needs a product decision on whether this ever becomes real money or stays a virtual-trust economy.
5. **Marketplace QA sign-off** — testing checklist exists but was never formally completed; recommend an actual manual QA pass before calling this pillar "done."
6. **Gamification/HuudCoin route duplication** — `/gamification` vs `/huud-economy` — pick one and redirect/remove the other.
7. **Emergency agency dispatch (backend-only, invisible to frontend)** — mock by default; if real dispatch to Nigerian agencies is a claimed feature, this needs real integration work.
8. **Native app gaps** — deep linking, biometric auth, release signing, geocode-proxy migration for static export builds.
9. **Admin analytics (two-sided)** — backend returns 0 for key metrics; admin UI is also the thinnest area — likely needs a joint rebuild.
10. **Test coverage** — Marketplace/Chat/Safety/Gamification have almost no automated tests despite being the biggest feature areas.
11. **Community governance/voting** — frontend has an admin panel component but backend governance is a stub — confirm scope before building further.
12. **MediaDownloadButton wiring** — built but not attached to post/content components yet.
13. **Global Search polish (two-sided)** — keyboard nav, pagination, trending searches missing frontend; analytics/trends stubbed backend.
