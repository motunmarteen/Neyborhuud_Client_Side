# Frontend Architecture Specification (Step 7)

> This document formalizes the **existing, verified architecture** of `NeyborHuud-PWA` as the
> target pattern for the rebuild — it does not invent a new structure. Every claim below is
> grounded in direct source inspection carried out across Steps 1-6 (or freshly verified while
> writing this document), not assumption. Where the codebase already deviates from a pattern
> described here, that deviation is either called out as an accepted exception or listed in the
> companion fix lists (`fix-list-safety-commerce.md`, `fix-list-social-community.md`,
> `fix-list-platform-auth.md`) as something to resolve.
>
> **Why formalize rather than redesign:** Steps 1-6 traced 209 real findings across the existing
> codebase and found the underlying architecture — not the bugs — to be sound. The
> Pages→Hooks→Services→API Client layering is real and consistently followed (with a small number
> of documented exceptions). A rebuild that discarded this structure would be solving a problem
> that doesn't exist while re-introducing risk into code that already works.

---

## 1. The Frontend Contract (verified, not proposed)

```
Page (app/**/page.tsx or PageClient.tsx)
   │
   ▼
Feature Hook (hooks/use*.ts — usually a thin React Query wrapper)
   │
   ▼
Feature Service (services/*.service.ts — one file per backend module, roughly)
   │
   ▼
API Client (lib/api-client.ts — single Axios instance, Bearer-token auth)
   │
   ▼
Backend (NeyborHuud-ServerSide, 37 modules, 565 routes)
```

This is the same contract the original rebuild plan proposed, and it is **already how the
codebase works** — confirmed by reading dozens of pages/hooks/services across Steps 4-6, not
assumed from the plan. Example, verified directly (`social-community-journeys.md`, Journey 5):

```
/notifications page
   → useUnreadCount() / useNotifications() hooks
   → notificationsService.getNotifications() / markAsRead()
   → apiClient.get('/notifications') / apiClient.patch('/notifications/:id/read')
   → GET/PATCH /api/v1/notifications/*
```

### 1.1 Where pages are allowed to skip a layer (confirmed exceptions, not violations)

A small number of pages call `apiClient` directly instead of going through a service — this is a
real, repeated pattern, not a one-off mistake, and the rebuild should decide deliberately whether
to keep allowing it:

- `pwa/src/app/(marketing)/pick-community/page.tsx` — raw `apiClient.get()` in the page component.
- `pwa/src/app/(app)/settings/payout/page.tsx` — calls `marketplaceService` methods directly
  rather than via a `use*` hook (skips the hook layer, not the service layer).
- `pwa/src/app/(app)/map/MapComponent.tsx` — two raw `apiClient.post/delete('/content/locations/follow', ...)`
  calls with no service wrapper at all (flagged in `fix-list-safety-commerce.md` #15 as worth
  fixing, since this one has no documented rationale, unlike the two above).

**Rule for the rebuild:** a page may skip the hook layer for a one-off, page-local mutation with
no reuse potential (matches the `/settings/payout` precedent). A page must never skip the service
layer entirely for a documented, registry-known route — `/map`'s case is the one real violation
of this rule found across all of Steps 1-6, and should be fixed, not adopted as a pattern.

### 1.2 The 300+ backend routes → ~30 frontend services ratio (verified)

The original plan predicted this compression; Steps 2 and 4-6 confirmed it's real:

- **565 backend routes** (Step 2, `02-api-registry/`, 37 modules)
- **31 frontend service files** (`pwa/src/services/*.service.ts`, counted directly)
- **56 frontend hooks** (`pwa/src/hooks/use*.ts`)

Not every backend module has a 1:1 frontend service — some backend modules share a frontend
service (e.g. `contentService` covers `content`, `fyi`'s alias routes, and part of `feed`), and
some frontend services cover functionality the backend splits across multiple modules. This is
expected and fine; the rebuild should preserve the service boundary as-is rather than force a
1:1 mapping that doesn't reflect how the product actually groups functionality.

---

## 2. Folder structure (as it exists — the target, not a proposal)

```
pwa/src/
├── app/                          Next.js App Router — route groups, not features
│   ├── (app)/                    Authenticated app shell (105 real pages total, see
│   │                             04-route-map/route-classification.md for the full list)
│   ├── (marketing)/               Public/onboarding (login, signup, verify-*, pick-community)
│   ├── app-root/                  Subdomain-rewrite landing/splash target (see middleware.ts)
│   └── api/                       Next.js API routes (geocode proxy — dropped in Capacitor
│                                   static-export builds, a confirmed native-build gap)
│
├── components/                   FEATURE-BASED, not atomic-design or `ui/`-only.
│   │                             37 subdirectories, confirmed via direct listing:
│   ├── ambient/  auth/  brand/  capacitor/  chat/  communities/  errors/  events/
│   ├── feed/  follow/  friendship/  fyi/  gamification/  help-request/  huud-economy/
│   ├── huud-gist/  icons/  jobs/  landing/  layout/  legal/  local-huud/  location/
│   ├── map/  marketplace/  navigation/  news/  onboarding/  payments/  profile/
│   ├── safety/  search/  sentinel/  services/  shared/  theme/  ui/  work/
│   │
│   │  NOTE: this is a real, deliberate divergence from the original plan's proposed
│   │  `components/{ui,navigation,layout,shared}/` + separate `features/` directory. The
│   │  codebase never adopted a `features/` folder — instead, `components/<domain>/` IS the
│   │  feature folder, and pages import directly from it. `components/ui/` exists and holds
│   │  true generic primitives (buttons, inputs, cards); `components/shared/` holds
│   │  cross-domain composites. This works, is internally consistent, and should be the
│   │  target — do NOT introduce a parallel `features/` tree in the rebuild.
│
├── services/                     31 files, one per (roughly) backend module or feature area.
│                                 Every service wraps `apiClient`; hooks call services, not
│                                 apiClient directly (see §1.1 for the narrow exceptions).
│
├── hooks/                        56 files. Convention: `use<Noun>()` for queries,
│                                 `use<Verb><Noun>()` for mutations (e.g. `useFollow`,
│                                 `useCreateEvent`, `useUpdateEvent`). React Query throughout —
│                                 no separate global store for server state.
│
├── contexts/                     Small, deliberately scoped set (8 files) for state that must
│                                 be live app-wide regardless of route: `SosContext`,
│                                 `GuardianAlertsContext`, `RedZoneAlertsContext`,
│                                 `SentinelBottomSheetContext`, `SwipeBackContext`. NOT a
│                                 general-purpose state layer — most state is either React
│                                 Query cache (server state) or component-local `useState`.
│
├── lib/                          105 files. The largest, least-structured directory — holds
│                                 genuine cross-cutting utilities (`api-client.ts`,
│                                 `authSession.ts`, `capNotifications.ts`, `systemTheme.ts`,
│                                 `currency.ts`/`toKobo()`, `i18n.ts`) alongside page-specific
│                                 helper modules. See §5 for the rebuild recommendation on this.
│
├── utils/                        Only 4 files (`device.ts`, `distance.ts`, `formatDate.ts`,
│                                 `timeAgo.ts`) — genuinely tiny, single-purpose helpers with
│                                 zero dependencies on app state. The `lib/` vs `utils/` split
│                                 is real but under-documented; see §5.
│
└── types/                        Shared TypeScript types, primarily API response shapes.
```

### 2.1 What the rebuild should NOT do

- **Do not introduce a `features/` directory.** `components/<domain>/` already serves this role;
  a parallel `features/` tree would fragment code that currently has one clear home.
- **Do not flatten `components/` into atomic-design tiers** (`atoms/molecules/organisms`). The
  existing `ui/` + `shared/` + 35 domain folders convention is what 37 real folders' worth of
  code already follows; changing it would touch every import in the app for no functional gain.
- **Do not assume `lib/` needs a wholesale reorganization before the rebuild can start.** It's
  large but not chaotic — see §5 for a scoped, incremental recommendation instead of a rewrite.

---

## 3. State management conventions (verified)

| State kind | Mechanism | Evidence |
|---|---|---|
| Server data (API responses) | **React Query** (`@tanstack/react-query` v5) exclusively | Every hook traced in Steps 4-6 (`useEvents`, `usePosts`, `useNotifications`, `useTrust`, etc.) uses `useQuery`/`useMutation`/`useInfiniteQuery` — no Redux, no Zustand, no SWR found anywhere. |
| App-wide live state (must update regardless of route) | **React Context**, narrowly scoped, 8 files total | `SosContext` (SOS phase machine), `GuardianAlertsContext`/`RedZoneAlertsContext` (app-wide socket-driven alert delivery), `SentinelBottomSheetContext`, `SwipeBackContext`. Not used for anything that could instead be a React Query cache entry. |
| Page-local UI state | `useState`/`useReducer`, component-scoped | The default for everything else — form state, tab selection, modal open/closed. |
| Persisted client-only state | `localStorage` (auth token, theme, onboarding flags, search history) | Confirmed in `api-client.ts` (token), `systemTheme.ts`, `authSession.ts` (`hasCompletedProductTour`), `/explore`'s search history (Step 4 finding — 100% client-side, no backend route). |
| Real-time updates | **Socket.IO**, via a shared `socketService` singleton — with confirmed exceptions | See §4. |

**Rebuild rule:** new features should default to React Query for anything server-derived, plain
`useState` for page-local UI, and only reach for a new Context if the state genuinely needs to be
live across arbitrary route changes (matching the bar the existing 8 contexts clear — SOS status,
live alert delivery). Do not introduce a new global state library; none exists today and none of
the 209 catalogued findings suggest a gap that would require one.

---

## 4. Real-time architecture: the shared-singleton rule (and its 3 known violations)

**The correct pattern**, confirmed working in `RedZoneAlertsContext.tsx`, `GuardianAlertsContext.tsx`,
and `/safety/emergency/page.tsx` (`safety:emergency_dispatch_update`): bind listeners onto the
single shared `socketService` singleton, never instantiate a second `socket.io-client` connection.

**Three confirmed violations**, all catalogued as open findings, not adopted as alternative
patterns:

1. `useTripMonitor.ts` (`/safety/trips`) — own raw `socket.io-client` connection, `emit('authenticate', token)` handshake.
2. `/safety/geofences/page.tsx` — own raw connection, `auth: {userId}` handshake at connect time.
3. (Implicitly, by omission) `/safety/trips/watch/[userId]` has **no socket at all** — 60s polling
   only, a real inconsistency versus the kidnapping-tracking guardian view, which correctly has
   both a poll fallback and a live socket subscription.

**Rebuild rule:** every new real-time feature binds to `socketService`. The three violations above
are tracked in `fix-list-safety-commerce.md` (#5, #24, #98) as things to fix during the rebuild,
not patterns to replicate.

---

## 5. `lib/` vs `utils/` — a scoped recommendation, not a rewrite

`lib/` (105 files) is large enough that "just leave it alone" isn't quite right, but a full
reorganization is out of scope for what Steps 1-6 actually found broken. The real, confirmed
problem is narrower: a handful of `lib/` files duplicate logic that should live in `services/` or
be deleted:

- `lib/trust-economy.ts`'s `buildTrustEconomyModel()` reimplements a synthetic trust score
  client-side that can diverge from the backend's own `canVouch` check (`fix-list-social-community.md`,
  Follow/Trust/Connections #1) — this is a `lib/` file computing business logic that arguably
  belongs server-side or should at minimum be clearly marked as display-only, never used for any
  gating decision.
- Two service wrappers hit the identical `PATCH /content/posts/:id/amount` endpoint
  (`contentService.updateHelpRequestAmount` and `helpRequestService.updateAmountReceived`,
  `fix-list-social-community.md`, Cross-Cutting #6) — a `services/`-layer duplication, not a
  `lib/` one, but the same underlying discipline gap (nobody checked for an existing wrapper
  before adding a new one).

**Rebuild recommendation:** don't reorganize `lib/` wholesale before starting feature work. Instead,
apply a narrow rule going forward: before adding a new `lib/` helper or `services/` method, grep
for an existing one first (the fix-list items above are exactly what happens when this isn't
done). Revisit `lib/`'s organization only if it keeps growing past its current size during the
rebuild, as a later, separate cleanup — not a blocking prerequisite.

---

## 6. Multi-platform build architecture (PWA + Capacitor Android, iOS not yet built)

Confirmed directly from `next.config.ts` and Step 1's audit — two build modes from one codebase:

```
                    pwa/src/  (single source tree)
                          │
              ┌───────────┴───────────┐
              │                       │
   Standard Next.js build       NEXT_PUBLIC_CAP=1 build
   (full SSR/PWA, web)          (static export, output: 'export')
              │                       │
        Vercel/web hosting     Capacitor 8 → Android APK/AAB
        Service worker,        No Next.js server at runtime —
        push notifications,    confirmed gaps: /api/geocode/* proxy
        installable PWA        route doesn't exist in this mode;
                                next.config's redirects() array is
                                dropped entirely (Capacitor pages
                                use client-side router.replace
                                shims instead, confirmed for
                                /messages/* — see route-classification.md)
```

**iOS does not exist yet** — this is the standing, memory-saved end-goal requirement: the rebuild
must produce an iOS build alongside Android, not just a redesigned PWA. Two concrete gaps already
found that will matter for iOS specifically, both already in the fix lists:

- Push notifications are Web-Push-shaped (VAPID/browser `PushSubscription`) with zero APNs/FCM
  device-token support anywhere in frontend or backend (`fix-list-platform-auth.md`, Mobile/PWA
  #High; `fix-list-safety-commerce.md` references the same gap via `mobile.md`). This needs real
  design work before iOS push can function at all — it is not a small addition.
- Two independent, redundant push-registration code paths already exist for the current Web-Push
  system (`notificationsService.registerPushToken` → `/auth/device/register` vs.
  `usePushNotifications.ts` → `/mobile/push/subscribe` directly) — worth consolidating into one
  path *before* adding a third (APNs) path on top, per `fix-list-social-community.md` (Notifications).

**Rebuild rule:** any new feature's real-time/push/native-integration work should be designed with
three targets in mind from the start (PWA, Android, iOS), not built for PWA first and retrofitted —
the existing push-notification duplication above is a direct consequence of not doing this
originally.

---

## 7. Summary: what changes, what doesn't

**Keep as-is (verified sound, formalized as the target by this document):**
- Pages → Hooks → Services → API Client contract
- Feature-based `components/<domain>/` structure (no `features/` tree)
- React Query for all server state; Context reserved for genuinely app-wide live state
- `socketService` singleton pattern for real-time (once the 3 violations are fixed)
- Dual-build (web + Capacitor) architecture, extended to add an iOS target

**Fix during the rebuild (tracked in the three fix-list files, 209 total findings):**
- 7 Critical, 46 High severity items — see `fix-list-safety-commerce.md`,
  `fix-list-social-community.md`, `fix-list-platform-auth.md` for the full, source-traced list.

**Decide deliberately, not accidentally:**
- Whether to standardize all 27 `protect`-only backend modules on `protectAny` before or during
  the rebuild (low-risk, backend-only change, already recommended in `_auth-middleware-split.md`).
- Which of each duplicate pair to keep as canonical (tip endpoints, notification alias routes,
  `PATCH /me` vs `PUT /me`, etc. — each listed individually in the fix lists).
- The `lib/` growth question from §5, revisited later rather than blocking Step 8 onward.
