# User Journeys — Safety / SOS / Emergency

> Step 6. Built on Step 4's `03-api-page-matrix/safety-sos-emergency.md` and Step 5's
> `04-route-map/route-classification.md` (trusted, not re-derived). This file corrects two Step 4
> findings after deeper source reads (see the relevant journeys below) and clarifies that the API
> registry's `/:id/interact/:type` path is a backend route, not a frontend page.

---

# Journey: SOS activation → resolution

## Trigger

Multiple independent entry points, all converging on the same `SosContext`/`useSos()` singleton:

1. **`FloatingSosButton`** (`pwa/src/components/sentinel/FloatingSosButton.tsx`) — globally mounted (visible on nearly every `(app)` route except an explicit `hidePaths` list covering auth/onboarding screens and `/chat/*`). Two distinct gestures on the same button:
   - **Short tap** (`pointerup`/`touchend`/`mouseup` without a prior long-press) → `router.push('/sos')`, just navigates to the command center, does not trigger anything.
   - **Long-press (600ms hold)** → fires `sos.triggerSos({ silent: true })` directly, no navigation, no confirmation UI at all — this is the one-gesture "silent SOS from anywhere in the app" path.
2. **`/sos` page → `SosTriggerCard`** — the explicit, visible trigger surface. Configurable silent toggle, 0–30s countdown slider (default 5s), "log for emergency services" checkbox. Button reads "Trigger SOS" or "Silent SOS" depending on the silent toggle.
3. **`TripsFloatingSosButton`** on `/safety/trips` (only rendered while a trip is live) — `onClick` wired to `useTripMonitor().triggerManualSos()`, which is a `router.push('/safety')` (not `/sos`), i.e. this button doesn't call `triggerSos` itself, it navigates to the Sentinel hub, which itself surfaces the SOS state banner. Code comment states this manual override "must always be callable regardless of trip/escalation state."
4. **Automatic, non-user-initiated**: `useTripMonitor` listens for a `trip:sos_triggered` socket event fired server-side when a trip's missed-check-in escalation reaches a threshold — this creates a real SOS server-side (`autoSosTriggered`/`autoSosEventId` state) without any client action at all. Journey 1 and the trip-monitoring escalation ladder converge here.
5. **Panic PIN real trigger** (`/safety/panic-pin/enter`) — see Journey 4; confirmed to feed a **silent** SOS into this same system server-side, though the frontend has no confirmation signal of this (see Gaps).
6. **`useSosGuardianDrill`** (Prepare tab, "Run a guardian drill") — a real server call (`POST /safety/sos/drill` per Step 4) that notifies real guardians but is explicitly documented as never creating a real `SosEvent`/dispatch — a deliberately parallel, non-`SosContext`-touching path, not part of this journey's state machine.

## Flow

```
                         ┌─────────────────────────────────────────┐
                         │   Entry points (any of):                │
                         │   • FloatingSosButton short-tap → /sos   │
                         │   • FloatingSosButton long-press (600ms) │
                         │   • SosTriggerCard on /sos "Now" tab     │
                         │   • Trip escalation (server-auto, silent)│
                         │   • Panic PIN /enter (server-side,silent)│
                         └───────────────┬───────────────────────────┘
                                          │
                              triggerSos({silent, countdownSeconds,
                                           emergencyServicesEnabled})
                                          │
                     ┌────────────────────┴─────────────────────┐
                     │  getCoords() — real GPS fix, fallback to  │
                     │  last-known coords if it fails; never     │
                     │  blocks the whole trigger on GPS failure  │
                     └────────────────────┬─────────────────────┘
                                          │
                        POST /safety/sos/trigger (clientId idempotency key)
                                          │
                ┌─────────────────────────┼──────────────────────────┐
                │ HTTP succeeds            │ HTTP fails, NO response  │  HTTP 4xx/5xx
                │ (server saw request)     │ reached (offline/no-sig) │  with response
                ▼                          ▼                          ▼
     status === 'pending'?      Optimistic local activeSos      setError(msg)
     ┌──────┴───────┐          (_id = clientId), enqueue to     shown inline on
     │ yes           │ no      IndexedDB (useSosOfflineQueue)   SosTriggerCard
     ▼               ▼         + Background Sync registered
  PENDING          ACTIVE      "queued" state — UI shows
  (countdown)      (refresh()  "triggered" even though
     │              pulls real  server hasn't confirmed
     │              state)          │
     │                              │ connectivity restored
     │                              │ (online event, SW
     │                              │  background-sync message,
     │                              │  or flush() on mount)
     │                              ▼
     │                     flush() retries POST /sos/trigger
     │                     with same clientId (idempotent) →
     │                     onSent() → refresh() pulls real state
     │
     │  SosCountdownOverlay shown (full-screen, unless silent —
     │  silent mode renders NOTHING, by design)
     │  socket: safety:sos_pending
     │
     ├── user taps "Cancel" (overlay or SosPageHero) ──► cancelSos()
     │        │                                          POST /:id/cancel
     │        ▼                                          → status 'cancelled'
     │   socket: safety:sos_cancelled_pending             (auto-clears to
     │   (also fires if cancelled from another device)    idle after 1.5s)
     │
     └── countdown reaches 0 (server-side) ──────────────► socket:
                                                              safety:sos_activated
                                                                    │
                                                                    ▼
                                                                 ACTIVE
                                                                    │
                ┌───────────────────────────────────────────────────┤
                │ While phase === 'active':                          │
                │  • watchPosition-driven location_heartbeat emitted │
                │    (throttled 1/5s client-side, server persists    │
                │    ~1/30s) → EmergencyTrackingLog, guardian fanout │
                │  • socket: safety:sos_alert → escalationLevel bump │
                │  • socket: safety:emergency_services_dispatched    │
                │    → refresh()                                     │
                │  • socket: safety:emergency_contact_needed →       │
                │    non-auto-clearing EmergencyContactOverlay        │
                │    ("call/text these numbers yourself" — last      │
                │    line of defense when no auto-dispatch exists)   │
                │  • Guardian side: GuardianAlertsContext receives    │
                │    safety:emergency_alert / safety:sos_activated,  │
                │    toast with "Respond" action, alert card with    │
                │    "I'm responding" (POST /:id/acknowledge) button │
                └──────────────────────┬──────────────────────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              │ user/guardian resolves │ user cancels while active│
              ▼                        ▼                          
          resolveSos()             cancelSos(reason)              
          POST /:id/resolve        POST /:id/cancel                
          → status 'resolved'      → status 'cancelled'            
          lastSummary captured     (both auto-clear to idle          
          (both auto-clear to      after 1.5s — deliberate pause      
           idle after 1.5s)        so terminal state is visible)
                                          
    Post-incident: /safety/incident/[id] recap page (GET /sos/:id/summary,
    POST /sos/:id/note) — reachable via incidentHref built from activeSos._id,
    and from GuardianAlertsContext's toast "Respond" action / "Incident timeline" link.
```

### Prose walkthrough

A user reaches SOS one of five ways: a short tap on the always-visible floating SOS button (navigates to `/sos`, no trigger yet); a 600ms long-press on that same button anywhere in the app (fires an **immediate silent** SOS, no confirmation UI, no navigation); the visible trigger card on `/sos` itself with configurable countdown/silent/emergency-services options; automatically via a trip's missed-check-in escalation ladder (`trip:sos_triggered` socket event, no user action); or via the disguised Panic PIN entry screen (server-side silent trigger, Journey 4).

On trigger, the client attempts a real GPS fix but falls back to last-known coordinates rather than blocking — a panic button must work even with a bad GPS lock. It then POSTs to `/safety/sos/trigger` with a client-generated idempotency key. Three outcomes: (1) the server accepts and returns `pending` — a full-screen countdown overlay appears (unless silent, which shows nothing at all, by design) with a single obvious Cancel button; (2) the server accepts and skips straight to active (silent path, `countdownSeconds: 0`); (3) the HTTP request never gets a response at all (no signal) — the context optimistically shows a local "triggered" state keyed by the client-generated id and queues the payload in IndexedDB, registering a Background Sync task so the service worker retries even if the app is closed. This is a deliberately robust offline-first design: the UI never leaves the user thinking their SOS silently failed.

Once active (either immediately or after the countdown elapses server-side), a live location heartbeat starts (browser `watchPosition`, throttled), guardians are notified in real time via sockets, and the UI can show an escalation level, a dispatch-confirmation, or — if there's no automated escalation path available — a persistent "call these numbers yourself" overlay that does not auto-dismiss. Guardians see incoming alerts via a separate always-mounted `GuardianAlertsContext`, get a toast with a "Respond" deep link, and can tap "I'm responding" to acknowledge. The SOS ends via `cancelSos()` (self-cancel, during pending or active) or `resolveSos()` (self or implied resolution) — both transition to a terminal state that's shown for 1.5 seconds before auto-clearing back to idle, so the user gets visible confirmation the emergency ended rather than the UI silently vanishing. A post-incident recap page (`/safety/incident/[id]`) is reachable afterward for a timeline/notes view.

## Cross-references

- Pages: `/sos` (primary surface), `/safety` (hub, shares `SosCountdownOverlay`/state), `/safety/manage` (guardian-facing dashboard panel, `DashboardActiveSosPanel`), `/safety/incident/[id]` (post-incident recap), `/safety/trips` (auto-SOS integration + manual override button), `/safety/emergency` (separate "Legacy Emergency" surface guardians may be routed to when no `sosEventId` exists on an alert).
- Routes: `/sos` has no client-side auth/verification gate per Step 5's route table (matches the backend's deliberate choice not to gate SOS behind `requireVerification`).

## Gaps or inconsistencies found

1. **Confirmed, not just flagged**: the offline queue (`useSosOfflineQueue.ts`) genuinely never expires a queued SOS trigger — comment explicitly states "help is late beats help silently never arrives," in contrast to trip check-ins which expire after 30 minutes. This is a deliberate, verified design strength, worth preserving.
2. **Silent long-press has zero acknowledgement of receipt to the user.** By design (silent = no visible UI at all), but this means if the long-press SOS fails to reach the server and gets queued offline, the user pressing it under duress has no signal whatsoever — not even the muted "queued" indicator that the visible `/sos` page would show — since `FloatingSosButton` never renders `offlineQueueStatus`. This is consistent with the security premise but is a real risk surface: a silent SOS triggered with no signal looks byte-for-byte identical (nothing happens on screen) whether it queued successfully or the long-press gesture simply didn't register at all.
3. **`TripsFloatingSosButton`'s manual override navigates to `/safety`, not `/sos` or a direct trigger.** It does not call `triggerSos()` itself — it relies on the user then finding and tapping the trigger control on the hub. This adds a navigation + decision step compared to the bottom-nav long-press, for a button whose own code comment says it "must never be gated behind trip conditions" (implying it should be a fast/immediate path). Worth reconsidering in the rebuild: should this fire a real trigger directly, matching the urgency implied by its placement?
4. Confirmed from source (not just Step 4's inference): guardians' "I'm responding" action (`acknowledge()`) is a genuinely separate call (`POST /sos/:id/acknowledge`) from the tracked user's own `cancelSos`/`resolveSos` — a guardian acknowledging does **not** resolve or otherwise change the SOS's phase for the affected user; it only records the guardian's response. This is correct behavior, but the UI copy ("Guardian response recorded — They will see that you acknowledged the alert") could give a guardian an inflated sense that the emergency is somehow "handled" once they've tapped it, when the tracked user's own SOS state machine is entirely unaffected.

---

# Journey: Incident report → witness/escalate/resolve

## Trigger

Single entry point: `/incident-reports` list page, "File report" button (only shown to signed-in users; toggles an inline `CreateIncidentForm`, not a separate route). No client-side pre-check for the server's `requireVerified` gate on POST — an unverified user gets whatever generic error `incidentService.create()` throws, with no explanatory UI (confirmed directly in `CreateIncidentForm.handleSubmit`, matching Step 4's flagged gap).

**Correction to the original framing**: `/:id/interact/:type` is a **backend API path** (`incidentService.interact()` → `POST /incident-reports/${id}/interact/${type}`), not a frontend route/page. There is no dedicated interact screen — witness/confirm/dispute are inline buttons on both the list-page card (`IncidentCard`) and the detail page, each firing the same service call with optimistic local count updates. Confirmed directly in both `pwa/src/app/(app)/incident-reports/page.tsx` and `.../[id]/PageClient.tsx`.

## Flow

```
/incident-reports (list, GET /incident-reports, infinite scroll)
        │
        ├── [signed in] "File report" → CreateIncidentForm (inline, same page)
        │       │  client validation: title ≥5 chars, description ≥20 chars
        │       │  POST /incident-reports  (no client verification pre-check)
        │       ▼
        │   success → toast, form closes, list reloads (page 1)
        │   [unverified user] → generic error toast, no explanation surfaced
        │
        ├── IncidentCard (any user, signed in or not, for read):
        │       witness / confirm / dispute buttons → optimistic count update →
        │       POST /:id/interact/:type  (toggles: re-tapping the same type removes it)
        │       [not signed in] → toast "Sign in to interact", no navigation
        │
        └── tap card → /incident-reports/[id]  (detail)
                │
                │  GET /:id, GET /:id/comments
                │
                ├── Interaction row (witness/confirm/dispute) — same as list card,
                │     available to ANY signed-in viewer, not just the reporter
                │
                ├── Comments — any signed-in user can post (optionally anonymous),
                │     POST /:id/comments; only comment OWNER sees a Delete link
                │     (DELETE /comments/:commentId) — no moderator/admin delete
                │     control visible anywhere in this page
                │
                └── Reporter-only action row (isReporter check, ONLY when
                    status is 'open' or 'in_progress'):
                        ├── "Add Update" → inline form → POST /:id/updates
                        │     (appended to Updates Timeline, visible to all viewers)
                        ├── "Escalate" → POST /:id/escalate
                        │     escalatedTo HARDCODED to 'community_admin'
                        │     (no picker UI despite service supporting arbitrary target)
                        └── "Resolve" → window.prompt() for resolution text →
                              POST /:id/resolve → incident.resolution shown to
                              all viewers, status row updates, reporter-only
                              actions disappear (status no longer open/in_progress)
```

### Prose walkthrough

Any signed-in user files a report from the `/incident-reports` list page via an inline form (no separate route) with a minimum length on title/description; the server independently enforces a `requireVerified` gate that the frontend does not pre-check or explain — an unverified user who fills out the whole form only discovers the block from a generic error toast after submitting. Once created, the report appears in the shared browse feed (filterable by category/severity/status/search) visible to any viewer, and the interaction surface (witness/confirm/dispute) is available on both the list card and the detail page to **any signed-in user**, not just the reporter — these are symmetric, low-stakes toggles with optimistic UI. Tapping through to the detail page (`/incident-reports/[id]`) surfaces comments (any signed-in user can post, optionally anonymously; only the comment's own author can delete it — no visible moderator override), an Updates timeline, and — gated strictly to the original reporter, and only while status is `open`/`in_progress` — three lifecycle actions: Add Update (free-text, appended, visible to everyone), Escalate (hardcoded to `community_admin`, no target picker despite the underlying service supporting one), and Resolve (uses a native `window.prompt()` rather than an in-page form, sets `incident.resolution` visible to all subsequent viewers). Once resolved, the reporter-only action row disappears entirely since it's gated on status.

## Cross-references

- Pages: `/incident-reports` (list/create/interact), `/incident-reports/[id]` (detail/comments/lifecycle).
- Routes: both auth-gated for interaction per Step 5 (browse open to signed-out visitors, create/interact/comment require sign-in).
- This journey is explicitly, and confirmed by source, unlinked to the SOS/Emergency system — no shared components, hooks, or services between `incident-reports` and `safety.service.ts`/`SosContext`.

## Gaps or inconsistencies found

1. **Confirmed from source**: no admin/moderator role check anywhere on the detail page. The only privileged actions gated in the UI are `isReporter` (a simple `reporterId === user.id` check) — there's no separate "admin can also resolve/escalate other users' reports" path visible in this component, even though the escalate action's hardcoded target (`community_admin`) implies an admin review step exists somewhere downstream (out of scope for the frontend).
2. **Confirmed**: `window.prompt()` is used for the resolution text on `handleResolve` — a native browser dialog inside an otherwise fully custom-styled app, no character limit, no cancel-safety (an empty/cancelled prompt correctly no-ops via the `if (!resolution) return` guard, but there's no rich-text or even multi-line support, and this is visually jarring compared to the Add Update inline form that handles the analogous free-text case properly).
3. **Confirmed**: `escalate()` hardcodes `escalatedTo: 'community_admin'` — there is no UI affordance to select a different escalation target, though `incidentService.escalate()` itself accepts an arbitrary string. A user cannot, for example, escalate directly to a specific agency type distinguishable from a generic community admin queue.
4. **Comment deletion has no visible moderation path** — only the comment's own author sees a Delete link (`isOwner` check against `currentUserId`). Neither the incident's reporter nor any admin-role check appears able to remove another user's comment from this page, which could be a real problem if a comment contains harassment, doxxing, or a false accusation on a live incident thread.
5. Consistent with Step 4: `PATCH /incident-reports/:id/status` and `PATCH /incident-reports/:id` are defined service-side but have no caller anywhere in either page — the only status transitions a user can trigger are Resolve and Escalate, nothing more granular.

---

# Journey: Live/kidnapping tracking (tracked user + guardian)

## Trigger

**Confirmed directly from source: kidnapping-tracking and Safe Trips are two entirely separate features, not variants of one journey**, despite superficially similar guardian-watch UIs. Evidence:
- Different backend services (`kidnappingTrackingService` vs `tripService`), different session/trip data models, different socket event namespaces (`kidnapping:*` vs `trip:*`), different offline-queue implementations (`useKidnappingTracking`'s own localStorage-based batch queue vs `useOfflineQueue` for trips).
- `useKidnappingTracking.startTracking()` accepts optional `sosEventId`/`emergencyId` parameters (so the API supports linking a session to an SOS), but **`LiveTrackingStartPanel`'s `onStart` callback and the page's `handleStart` never pass either** — confirmed by reading both files; only `emergencyType` and `intervalSeconds` are ever supplied. So in the current frontend, kidnapping-tracking is **always started manually and independently** from `/safety/kidnapping-tracking`'s Start tab — it is never auto-triggered by an SOS in this codebase, even though the plumbing for that link exists server-side.
- Guardian discovery is symmetric-but-separate: `LiveTrackingGuardianPanel` (Circle tab of `/safety/kidnapping-tracking`) calls `getActiveSessionsForGuardian()` and lists live sessions with links into `/safety/kidnapping-tracking/watch/[sessionId]`. **This directly contradicts Step 4's flagged gap** ("no in-app screen listing all currently-watchable sessions for a guardian") — that screen does exist, just nested inside the tracking page's Circle tab rather than as its own route. Trip-guardian discovery, by contrast, happens via `SosGuardianIncomingAlerts`' "Trip view" link (built from an SOS/emergency alert's `userId`) or presumably a similar circle panel on `/safety/trips`, landing on `/safety/trips/watch/[userId]`.

## Flow

```
TRACKED USER SIDE (kidnapping-tracking)              GUARDIAN SIDE
─────────────────────────────────────                ──────────────────────────────
/safety/kidnapping-tracking (Start tab)
  eligibility gate: getLiveTrackingBlockers()
  (signed in + email verified + full name +
   NG phone) — mirrors backend requireVerification
        │ [blocked] → actionable messages/links
        │            (/verify-email, /complete-profile)
        │ [eligible]
        ▼
  "Start session" → POST /kidnapping/sessions/start
  (emergencyType, intervalSeconds — NO sosEventId/
   emergencyId ever passed by this UI)
        │
        ▼
  session status: active
  → tab auto-switches to Live
  → startInterval(): battery-adaptive ping loop
    (30s base, x2 at ≤20% battery, x3 at ≤10%)
        │
        ├── each ping: GPS fix → POST .../location
        │     GPS fails → POST /kidnapping/triangulate
        │       (registry-flagged possible stub, called anyway)
        │     offline → localStorage queue (72h max age,
        │       500-point cap, oldest dropped first)
        │           │
        │           └─ online again → flushOfflineQueue()
        │              batches of 50 → POST .../location/batch
        │
        ├── socket: kidnapping:tracking_started (banner, 8s)
        ├── socket: kidnapping:location_update (merges into trail)
        └── socket: kidnapping:signal_lost (wsAlert banner)
                                                        │
                                          ┌─────────────┴──────────────┐
                                          │  Guardian discovers session  │
                                          │  via /safety/kidnapping-     │
                                          │  tracking → Circle tab →     │
                                          │  LiveTrackingGuardianPanel   │
                                          │  → getActiveSessionsForGuardian│
                                          │  (polled 30s) → link list    │
                                          └─────────────┬──────────────┘
                                                        ▼
                                    /safety/kidnapping-tracking/watch/[sessionId]
                                    GET /kidnapping/sessions/:id (403→"not an
                                      accepted guardian", 404→"not found")
                                    GET .../latest
                                    30s poll (setInterval) AS WELL AS:
                                    socket: kidnapping:location_update (primary,
                                      near-real-time — 30s poll is fallback only)
                                    socket: kidnapping:signal_lost
                                        │
                                        ▼
                                    Read-only view: status pill, last location,
                                    distance/points/missed-pings stats, manual
                                    "Refresh" button
        │
        ▼
  "Stop tracking" → POST .../stop
  → session cleared client-side, Live tab
    reverts to "no active session"
                                                        │
                                                        ▼
                                          Guardian's next poll/socket event
                                          reflects session.status === 'ended'
                                          (or 'lost_signal' if signal dropped
                                           before an explicit stop)


────────────────────────────────────────────────────────────────────────────

TRACKED USER SIDE (Safe Trips — separate feature)     GUARDIAN SIDE
─────────────────────────────────────                ──────────────────────────────
/safety/trips (Start tab)
  planTrip() [planned, no tracking] OR
  startTrip() [create+activate in one call]
        │
        ▼
  useTripMonitor: watchPosition + 30s interval
  fallback + visibilitychange resume-ping
  → POST /trips/:id/location
  own raw socket.io-client connection (NOT
  socketService) — trip:started/escalation/
  missed_checkin/completed/route_deviation/
  update/sos_triggered
        │
        ├── missed check-ins → escalationAlert banner
        │     (level 1-3)
        ├── level-3 escalation (server-driven) →
        │     trip:sos_triggered → autoSosTriggered=true,
        │     autoSosEventId set — THIS is where trips and
        │     SOS (Journey 1) actually connect, automatically,
        │     with no user action
        │
        TripsFloatingSosButton (manual override, always
        visible while trip is live) → router.push('/safety')
        — does NOT call triggerSos() directly
                                                        │
                                          Guardian reaches trip view via
                                          SosGuardianIncomingAlerts' "Trip view"
                                          link (built from alert.userId) →
                                                        ▼
                                    /safety/trips/watch/[userId]
                                    GET /trips/guardian-view/:userId
                                    (403 → "not an accepted guardian")
                                    60s poll ONLY — no socket subscription
                                    found in this component
                                    Prominent "SOS Activated Automatically"
                                    banner when trip.linkedSosEventId is set
```

### Prose walkthrough

Kidnapping-tracking and Safe Trips are genuinely separate systems that happen to share a visual pattern (tabbed monitor page + a `.../watch/[id]` guardian view). A user starts kidnapping-tracking manually from `/safety/kidnapping-tracking`'s Start tab, gated by an eligibility check that mirrors the backend's verification requirement (signed in, email verified, complete name + Nigerian phone). Despite the underlying API supporting a `sosEventId` link parameter, the current frontend never supplies one — kidnapping-tracking is always a standalone, manually-started session in this codebase, not something auto-triggered by an SOS. Once started, the session pings location on a battery-adaptive interval (backing off automatically at low battery), queuing pings in `localStorage` for up to 72 hours if offline and flushing them in batches of 50 on reconnect, with a GPS-triangulation fallback if the device's location sensor fails outright.

A guardian discovers a live session not via a link shared through a notification (as Step 4 speculated might be the only path) but through a dedicated in-app listing: the Circle tab of the tracking page itself polls for all sessions the current user is an accepted guardian on and links into each one's dedicated read-only watch page. That watch page combines a 30-second poll fallback with a primary live-update path over the shared socket, distinguishing "active" from "lost signal" (missed pings, no explicit end) from "ended" (explicit stop).

Safe Trips is a lighter-weight, separate feature for planned journeys: a trip can be created in a "planned" state with no tracking yet, then explicitly activated, or created-and-activated in one step. Its guardian escalation ladder (missed check-ins) is where trips and the SOS system in Journey 1 genuinely connect — a level-3 escalation server-side automatically creates a real SOS with no user action, surfaced via a `trip:sos_triggered` socket event and a persistent banner on both the tracked user's and guardian's views. The trip's own floating SOS button is a manual override that always remains reachable, though it currently just navigates to the hub rather than firing a trigger directly. The trip guardian view, unlike the kidnapping-tracking guardian view, has no socket subscription at all — it relies solely on a 60-second poll, meaning it is meaningfully slower to reflect changes than the kidnapping-tracking guardian view.

## Cross-references

- Pages: `/safety/kidnapping-tracking` (tracked-user, tabbed Live/Start/Trail/Circle), `/safety/kidnapping-tracking/watch/[sessionId]` (guardian), `/safety/trips` (tracked-user, tabbed Trip/Start/History/Circle), `/safety/trips/watch/[userId]` (guardian), `/safety/trips/history` (standalone history route sharing the same panel component), `/sos` (auto-SOS convergence point for trips).
- Routes: `/safety/kidnapping-tracking` has the `getLiveTrackingBlockers()` client gate (Step 5 confirmed); both watch routes are server-enforced guardian checks surfaced only as caught 403s, no client-side pre-check on either.

## Gaps or inconsistencies found

1. **Corrects a Step 4 finding**: Step 4 flagged `GET /safety/kidnapping/sessions/guardian-active` as having no caller and speculated there might be no in-app screen listing all watchable sessions for a guardian. Direct source read shows this is **incorrect** — `LiveTrackingGuardianPanel.ActiveSessionsList` does call `kidnappingTrackingService.getActiveSessionsForGuardian()` and does render a linked list. The feature exists; it's just nested in the Circle tab of the tracking page rather than being independently discoverable, which is arguably still a minor UX gap (a guardian who never opens `/safety/kidnapping-tracking` themselves, and only ever gets a direct link, might not know this listing screen exists) but is not the missing-feature gap originally flagged.
2. **Real inconsistency, confirmed in source**: the guardian trip view (`/safety/trips/watch/[userId]`) has no socket subscription at all — pure 60s polling — while the guardian kidnapping-tracking view (`/safety/kidnapping-tracking/watch/[sessionId]`) has both a 30s poll fallback AND a live socket subscription. For a feature whose entire value proposition is "follow someone in a high-risk moment as close to real time as possible" (the tracking view's own copy), a guardian watching a trip that just auto-triggered an SOS could be looking at up to a minute of stale data with no live-update mechanism at all. This is a meaningful asymmetry for two features that present as equally safety-critical.
3. **The `sosEventId`/`emergencyId` linking capability in `useKidnappingTracking.startTracking()` is dead code from the frontend's perspective** — the parameters exist and are typed, but no call site in the codebase ever supplies them. If the intent (per the API's own shape) was for an SOS trigger to be able to kick off kidnapping-tracking automatically the way trip escalation kicks off SOS, that link does not currently exist in the UI. Worth a product decision in the rebuild: should triggering a real (non-drill) SOS also offer/auto-start kidnapping-level tracking?
4. **`TripsFloatingSosButton`'s manual override does not itself call `triggerSos()`** — same finding as Journey 1's gap #3, relevant here because it means the tracked user, mid-trip, in a moment where they've decided to hit the manual SOS button, is routed through an extra navigation + decision step (`/safety` hub) rather than an immediate trigger, despite the code's own comment insisting this button "must never be gated behind trip conditions."

---

# Journey: Panic PIN enter → practice → real trigger

## Trigger

Setup happens at `/safety/panic-pin` — a normal, findable, authenticated settings page (`set`/`rotate`/`remove` modes, `POST`/`DELETE /safety/panic-pin`). This page is the **only** discoverable/linked entry point into either the real or practice keypad screens: it links to `/safety/panic-pin/practice` (labeled, safe) and describes — but does not link to — `/safety/panic-pin/enter` (the real trigger, described in-page only as "a separate, unlisted address," deliberately not rendered as a clickable link at all in the page source).

## Flow

```
/safety/panic-pin  (setup — set/rotate/remove, requires normal auth)
   │
   │ GET /panic-pin/status  → pinSet boolean
   │
   ├── [not set] "Set Panic PIN" form → POST /panic-pin
   ├── [set] "Change PIN" → POST /panic-pin (with currentPin)
   ├── [set] "Remove PIN" → DELETE /panic-pin (with currentPin)
   │
   └── [only if pinSet] Link → /safety/panic-pin/practice
         (page copy explicitly instructs the user to bookmark
          /safety/panic-pin/enter separately, under an
          unremarkable name — that page is described but has
          NO <Link>/router call anywhere pointing to it)


/safety/panic-pin/practice                    /safety/panic-pin/enter
(separate page.tsx, reached only              (separate page.tsx, reached ONLY by
 via the Link above)                           direct URL entry / bookmark — zero
                                                in-app Link/router.push call sites
                                                found anywhere, confirmed by source
                                                and matches Step 5's route table note)
   │                                                │
   │  renders PanicPinKeypad                        │  renders PanicPinKeypad
   │  (identical visual shell)                       │  (identical visual shell)
   │                                                │
   │  onSubmit(pin) — pin ARGUMENT IS               │  onSubmit(pin) — real digits used
   │  DISCARDED (`void _pin`), never inspected       │
   │  400-700ms artificial delay                    │  getCoords() (best-effort GPS)
   │  Math.random() > 0.4 → fake "Verified."         │  POST /safety/panic-pin/verify
   │  else fake "Incorrect PIN."                     │    { pin, latitude, longitude }
   │                                                │
   │  NO network call of any kind — confirmed,       │  Success (real PIN match) →
   │  no import of safetyService anywhere in         │    server-side: triggers a SILENT
   │  this file                                      │    SOS (per Step 4's registry
   │                                                │    note — not independently
   │  Small fixed "Practice mode" banner             │    re-verified against backend
   │  (outside the disguised keypad's own            │    source this pass) → returns
   │  layout, so a screenshot of just the             │    { verified: true }
   │  keypad still matches the real screen)          │  Client shows: "Verified."
   │                                                │
   │                                                │  Failure (wrong PIN) → catch
   │                                                │    block → client shows:
   │                                                │    "Incorrect PIN."
   │                                                │
   │                                                │  Both outcomes render via the
   │                                                │  EXACT SAME PanicPinKeypad
   │                                                │  onSubmit return shape —
   │                                                │  {message: string} — no other
   │                                                │  visual distinction anywhere
   ▼                                                ▼
onCancel → router.back()                     onCancel → router.back()
```

### Prose walkthrough

A user sets up their Panic PIN through a completely normal, authenticated settings page. That page is the single source of truth for reaching either the practice or real screens — and it treats them very differently: `/safety/panic-pin/practice` gets an actual in-app `<Link>`, while `/safety/panic-pin/enter` is only ever described in body copy, with explicit instructions to bookmark it manually under a name that gives nothing away. A repo-wide read of the practice and enter pages confirms this distinction is real and holds at the component level, not just in comments: the two pages are separate `page.tsx` files with separate `onSubmit` implementations. Practice mode's handler **discards the entered digits entirely** (`void _pin`) and fabricates a random "Verified."/"Incorrect PIN." response after an artificial delay, with zero network calls anywhere in the file — there is no code path in the practice page that could ever reach the real backend, even if the user's actual PIN is typed there by mistake. The real enter page's handler does the opposite: it takes a best-effort GPS fix, sends the actual digits to `POST /safety/panic-pin/verify`, and — per Step 4's already-verified registry finding — a correct match triggers a **silent** SOS server-side. Both pages render their result through the identical `PanicPinKeypad` component with an identical `{ message: string }` shape, so "Verified." (real success, SOS silently fired) and "Verified." (practice, nothing happened) are visually indistinguishable from each other, and from "Incorrect PIN." on either screen — this is the entire security premise of the feature, confirmed as implemented, not just documented.

Because the SOS this triggers is silent, it feeds into the exact same `SosContext`/`SosPhase` state machine as Journey 1 — same `/safety/sos/trigger`-adjacent lifecycle, same guardian notification path — just with `visibilityMode: 'silent'`, meaning `FloatingSosButton`'s `isSilentActive` check (`sos.activeSos?.visibilityMode === 'silent'`) suppresses every visual indicator app-wide, exactly as it does for the long-press silent trigger in Journey 1.

## Cross-references

- Pages: `/safety/panic-pin` (setup), `/safety/panic-pin/practice` (safe rehearsal), `/safety/panic-pin/enter` (real trigger).
- Routes: per Step 5, `/safety/panic-pin/enter` has "no app-level auth gate (security-by-obscurity)" — confirmed, this page renders with no authentication check visible in its own source (it calls an authenticated API endpoint, but the page itself doesn't gate on `useAuth()` the way most `(app)` pages implicitly do via layout).
- Connects into Journey 1 (SOS activation) at the moment of a successful real-PIN verify — same underlying `SosEvent`/`SosContext` system, `visibilityMode: 'silent'`.

## Gaps or inconsistencies found

1. **The frontend has zero visibility into whether the silent SOS actually fired.** `verifyPanicPin()`'s success path only returns `{ verified: true }` — no `sosEventId`, no `activeSos` update, nothing that would let `SosContext` immediately reflect the new silent SOS. The `enter` page doesn't call `refresh()` or import `useSos()` at all. In practice, `SosContext`'s own socket listeners (`safety:sos_activated` etc., bound app-wide whenever the user is authenticated) would presumably pick this up shortly after, assuming the panic-pin-triggered SOS reaches the same socket room as a normal trigger — but this specific link was **not independently verified this pass** (would require reading backend source, out of scope), so this should be treated as a real, unverified gap rather than assumed to work. If the socket event is somehow scoped differently for panic-pin-originated SOS events, a user who fired a real silent SOS via this screen would see literally no client-side confirmation anywhere in the app that anything happened — by design for the disguise, but risky if the underlying link is in fact broken.
2. **`/safety/panic-pin/enter` is reachable purely by URL guess or bookmark, with no rate-limiting or lockout visible client-side.** The page itself does not throttle repeated submissions — an attacker forcing a phone open and testing multiple PINs against this screen would get an identical "Incorrect PIN." each time with no client-side friction (any throttling would have to be server-side; not verified this pass).
3. **Setup page's own security instructions are undermined by nothing enforcing them.** The `/safety/panic-pin` page's copy tells the user to bookmark `/safety/panic-pin/enter` under an unremarkable name, but there is no in-app mechanism (e.g., generating a random-looking URL, or requiring the user to actually create the bookmark before considering setup "complete") that verifies this actually happened — the safety of the whole feature rests entirely on the user manually following prose instructions.

---

# Journey: Sentinel AI threat-scanning → alert delivery

## Trigger

There is **no user-initiated trigger for detection itself** — Sentinel's scanning is a passive, always-on backend process (per its own in-page copy: "Sentinel reviews signals from chat, feed, and location"). The only user-controlled inputs are on the **delivery** side: `/safety/sentinel/settings` (severity floor `all`/`high`/`critical`, a 0-10 `redZoneMinThreatScore` sensitivity dial, and a `redZoneWorkAreaEnabled` toggle for whether advisories near a saved work place also count, in addition to home). The settings page's own header comment is explicit and load-bearing: detection scoring is **identical for every user in an LGA** — these controls only filter what reaches an individual after the fact. `/safety/sentinel` itself (the hub page) is a read surface, not a trigger — it lists recent alerts and links to settings.

**Correction/clarification to Step 4's matrix**: the matrix flagged `notificationsService.getRedZoneAlerts()` as "not backed by any route in safety.md" and cross-cluster to the notifications module — confirmed still true this pass; a red-zone advisory is persisted and fetched as a `Notification` document (`GET` via `notificationsService.getRedZoneAlerts(10)`), not a `safety.md`-registered resource, even though the settings that tune it (`GET`/`PATCH /safety/settings`) do live in `safety.md`. Detection and delivery-settings are safety-cluster; the alert record itself is notifications-cluster. This split is real, confirmed directly in `RedZoneAlertsContext.tsx`'s imports.

## Flow

```
                    SENTINEL DETECTION (backend, passive, no user trigger)
                    scans chat / feed / marketplace-jobs-events / location
                    context / trust+report signals (per /safety/sentinel's
                    own "What Sentinel watches" copy) — scoring identical
                    for every user in an LGA
                                    │
                                    ▼
                     Notification document created server-side
                     (data: {location, severity, threatScore, alertId, reason})
                                    │
              ┌─────────────────────┴──────────────────────┐
              │  Delivery filtered per-user by                │
              │  /safety/sentinel/settings (redZoneMinSeverity,│
              │  redZoneMinThreatScore, redZoneWorkAreaEnabled)│
              │  — server-side per updateSafetySettings()      │
              └─────────────────────┬──────────────────────┘
                                    │
              ┌─────────────────────┼───────────────────────┐
              │ socket: safety:red_zone   OR   GET /notifications/
              │ (RedZoneAlertsContext,         red-zone-alerts (poll on
              │  app-wide, live)                mount/user-change fallback)
              └─────────────────────┬───────────────────────┘
                                    │
                        RedZoneAlertsContext.alerts[]
                     (deduped by id, dismissedRef tracked
                      client-side across both paths)
                                    │
        ┌───────────────────────────┼────────────────────────────┐
        │                           │                             │
        ▼                           ▼                             ▼
  toast (socket path only)   RedZoneBanner            RecentRedZoneAlerts list
  toast.error (critical,     (top of /feed,           (/safety/sentinel page,
  15s) or toast.warning      shows only alerts[0]      shows full alerts[] with
  (non-critical, 8s);        + "N more" count,          severity badge + reason
  action "View" →            severity-tinted            + threatScore, individually
  window.location.href       gradient background)       dismissible)
  = '/safety/sentinel'
        │                           │                             │
        └──────────────┬────────────┴──────────────┬──────────────┘
                        ▼                           ▼
              User dismisses (✕) →       User taps through (toast "View"
              dismissAlert(id):            action, or clicking into
              - removed from local          /safety/sentinel directly)
                alerts[] immediately        → lands on /safety/sentinel,
              - if alert has a               sees the same alert again in
                notificationId (i.e.         RecentRedZoneAlerts, can
                it was ever fetched          dismiss from there too
                from /notifications,
                not just socket-pushed)
                → POST markAsRead(id)
                persists the dismissal
                server-side so it does
                NOT reappear on next
                refresh/reload
              - if socket-only (no
                notificationId yet) →
                dismissal is IN-MEMORY
                ONLY (dismissedRef Set)
                for this session — see
                Gaps
```

### Prose walkthrough

Sentinel's scanning has no trigger in the traditional sense — it is a standing, backend-only process that scores content the same way for everyone in an LGA (chat/DM messages, feed posts, marketplace/jobs/event listings, location proximity to a saved home or work area, and weighted community trust/report signals, per the hub page's own explainer copy). A scored advisory becomes a `Notification` document server-side; there is no separate "SentinelAdvisory" resource the frontend fetches — `RedZoneAlertsContext` (mounted app-wide alongside `GuardianAlertsContext`) pulls these via `notificationsService.getRedZoneAlerts(10)` on login/mount, and also listens live over the shared socket for a `safety:red_zone` event so a fresh advisory can appear without a refresh.

Delivery, not detection, is what `/safety/sentinel/settings` actually controls: a coarse severity floor (all/high/critical — since a recent product change this genuinely filters server-side, no longer a placeholder per the settings page's own code comment), a 0-10 sensitivity floor on the raw threat score, and whether a saved work-area LGA is included alongside home. None of these change what gets scored or flagged — only what reaches this particular user's client.

Once an advisory reaches the client, it shows up in three places simultaneously, not just one: a **toast** (only for the live socket path, not the polled-history path — severity-differentiated duration and styling, `toast.error` for critical vs `toast.warning` otherwise, with a "View" action that does a hard `window.location.href` navigation to `/safety/sentinel` rather than a Next.js client-side route), the **`RedZoneBanner`** at the very top of `/feed` (confirmed rendered there, above the feed's other content — shows only the single highest-priority alert plus an "N more" count, not the full list), and the **`RecentRedZoneAlerts`** list on `/safety/sentinel` itself (the full, individually-dismissible list with severity badge, message, and threat score). `FeedSentinelRow` (the collapsible "Sentinel · Protected" command bar also on `/feed`) is a separate, unrelated UI element — it's a static feature-launcher grid pulled from `SENTINEL_FEATURES` catalog data, not driven by `RedZoneAlertsContext` at all, and does not surface live advisories itself; it's the hub-launcher, `RedZoneBanner` is the advisory-delivery surface. A user acts on an advisory by dismissing it (✕, on either the banner or the list) or tapping through to `/safety/sentinel` to see it in context alongside the "What Sentinel watches" explainer and the "Related tools" grid (linking to Emergency, Geofences, Guardians) — there is no "share" action anywhere in this flow, and no way to escalate an advisory directly into an SOS or incident report from the alert card itself; the page's own "How it works" copy explicitly tells the user to use SOS or Emergency report separately for immediate danger.

## Cross-references

- Pages: `/safety/sentinel` (hub, alert list + explainer), `/safety/sentinel/settings` (delivery filter, not detection tuning), `/feed` (renders both `RedZoneBanner` and the unrelated `FeedSentinelRow` command bar).
- Components: `RedZoneAlertsContext` (`pwa/src/contexts/RedZoneAlertsContext.tsx`, the actual data/delivery layer), `RedZoneBanner` (`pwa/src/components/feed/RedZoneBanner.tsx`), `FeedSentinelRow` (`pwa/src/components/feed/FeedSentinelRow.tsx`, confirmed **not** wired to `RedZoneAlertsContext` — a separate static launcher).
- Cross-cluster: the underlying alert data is a `notifications.md`-scoped resource (`GET /notifications/red-zone-alerts`, `markAsRead`), not a `safety.md` route — the settings that filter it (`GET`/`PATCH /safety/settings`) are the only part of this journey that's actually in the safety cluster's own registry, confirmed matching Step 4's flag.
- Related tools linked from `/safety/sentinel`: `/safety/emergency`, `/safety/geofences`, guardians (via the "Related tools" grid using `getSentinelFeature('guardians')`).

## Gaps or inconsistencies found

1. **Confirmed, real gap**: a socket-only advisory (one that arrived via `safety:red_zone` and was never subsequently fetched via `getRedZoneAlerts()`) has no `notificationId`. Dismissing it only adds its `id` to an in-memory `dismissedRef` Set — there is no server persistence for that dismissal. If the next `refresh()` call (e.g., on next app open, or the next `user?.id` change) pulls the same alert back from `/notifications/red-zone-alerts` before it's been separately marked read some other way, the `dismissedRef` check does prevent it from being re-added client-side within the same session, but a full page reload resets `dismissedRef` to empty — so a dismissed-but-never-persisted alert **can reappear after a reload**, contradicting the dismiss button's implied promise of "this won't come back."
2. **The toast's "View" action does a hard navigation (`window.location.href`), not a Next.js router push.** Every other in-app link in this cluster uses `next/link` or `router.push`; this one causes a full page reload to reach `/safety/sentinel`, losing any client-side state (e.g., an in-progress form elsewhere) — inconsistent with the rest of the app's navigation pattern, worth fixing in the rebuild.
3. **No escalation path from an advisory to SOS/incident report exists in the UI.** A critical, `toast.error`-worthy advisory only offers "View" (navigate to the list) or dismiss — there is no "This is happening to me" / "Trigger SOS" / "File incident report" action directly on the alert itself, despite the advisory potentially being about the user's own immediate area. The user must manually navigate away to `/sos` or `/incident-reports` themselves; Sentinel does not bridge to either.
4. **`FeedSentinelRow`'s "Protected" status label is static, not derived from any live check.** It always reads "Protected" with a pulsing dot — this is presentational chrome from the feature catalog, not a real health/connectivity indicator tied to whether Sentinel scanning or alert delivery is actually working for this user at this moment. A user could have red-zone delivery fully broken (e.g., failed `getRedZoneAlerts()` calls, silently caught) and this bar would still say "Protected."

---

# Journey: Sentinel/Guardian management hub (`/safety/manage`)

## Trigger

Reached via the "Manage Sentinel" button inside `FeedSentinelRow`'s expanded grid (`router.push('/safety/manage')`), the `/safety` hub's "Dashboard" hero link (per Step 4's matrix), or directly by hash-suffixed URL (`/safety/manage#guardians`, `#status`, `#checkins`, `#alerts`) — confirmed these are genuine deep links, not dead fragments: `tabFromHash()` runs on mount and on every `hashchange` event, mapping each known hash to one of six `DashboardTab` values (`overview`/`guardians`/`circle`/`checkins`/`alerts`/`tools`). `/safety/dashboard` is a pure server-side `redirect()` into this same page (confirmed by Step 4, not re-derived).

## Flow

```
/safety/manage  (tab state seeded from window.location.hash on mount)
        │
        │  HASH_TO_TAB mapping (read-side, confirmed from source):
        │    #guardians → guardians tab
        │    #linkers, #status → circle tab
        │    #checkins → checkins tab
        │    #alerts, #history → alerts tab
        │    (anything else / no hash) → overview
        │
        ├── Overview tab
        │     DashboardHowItWorks (static explainer)
        │     DashboardActiveSosPanel (sos.phase-driven — SAME SosContext as
        │       Journey 1; "No active SOS" empty state links to /sos;
        │       'pending' shows inline cancel; 'active' shows guardian
        │       activity log via GET /guardian-activity/:sosEventId,
        │       "I'm safe" → resolveSos(), "Full timeline" → deep-links to
        │       /safety/incident/[id] — this is the SAME recap page as
        │       Journey 1, not a separate one)
        │     Incoming-guardian-request nudge banner (if pendingIncoming &gt; 0)
        │       → tap switches to Guardians tab
        │
        ├── Guardians tab
        │     GuardianVsCircleExplainer (static, explicitly disambiguates
        │       "Guardian" [gets SOS/trip/live alerts] from "Circle"
        │       [status-only, no location])
        │     DashboardGuardiansPanel:
        │       ├── Incoming requests list (if any) → Accept/Reject buttons
        │       │     POST /guardians/respond {requestId, action}
        │       ├── "Add a guardian" form:
        │       │     "Load followers" button → GET /follow/:id/followers +
        │       │       /following, intersected client-side for MUTUAL
        │       │       follows only (not called automatically — user must
        │       │       tap first)
        │       │     search/filter the mutual-follow list → select →
        │       │       nickname + relationship-type picker →
        │       │     POST /guardians/request {guardianId, nickname,
        │       │       relationshipType, priorityLevel, isTemporary,
        │       │       expiresAt}
        │       └── "Your guardians" list (status-filterable: all/pending/
        │             accepted/rejected/removed) → per-row "Remove" →
        │             DELETE /guardians/:guardianId (hidden once already
        │             'removed')
        │
        ├── Circle tab   (NOTE: labelled "Circle" in the tab strip, but its
        │     hash aliases are #status and #linkers, not #circle — a real
        │     naming drift, see Gaps)
        │     GuardianVsCircleExplainer (same static block, repeated)
        │     DashboardLiveStatusPanel:
        │       loadMyStatus() → GET /status/me (confirmed still 404s per
        │         Step 4's flag; falls back silently to GET /status/:userId
        │         with the current user's own id)
        │       "Update status" → POST /status/update
        │       DashboardCirclePanel (SEPARATE component, SAME tab):
        │         GET /circle/mine, /circle/incoming, /circle/belong-to
        │         "Invite a mutual follower" list — reuses the SAME
        │           GET /follow/:id/followers+/following intersection
        │           pattern as the Guardians tab's linker list, but this
        │           copy is its OWN independent fetch (component-local
        │           useEffect), not shared/cached with DashboardGuardiansPanel
        │         Incoming circle invites → Accept/Decline →
        │           POST /circle/invites/:inviteId/respond
        │         "People in your circle" → per-row Remove →
        │           DELETE /circle/:memberId
        │         "Circles you belong to" — read-only list of whose status
        │           feed this user can see (symmetric to belong-to)
        │
        ├── Check-ins tab
        │     DashboardCheckInsPanel:
        │       GET /checkins/active → schedule or null
        │       [no schedule] interval picker (30m/1h/2h/4h/8h) →
        │         POST /checkins/start (confirms via window.confirm() if a
        │         stopped schedule object already exists client-side,
        │         because starting silently replaces it server-side)
        │       [active schedule] "I'm okay" → POST /checkins/checkin
        │                          "Pause" → POST /checkins/pause
        │                          "Stop" → POST /checkins/stop
        │       [paused] "Resume" → POST /checkins/resume
        │       escalationLevel &gt;= 3 banner: "a silent SOS was sent to your
        │         guardians" — SAME silent-SOS convergence pattern as the
        │         Safe Trips missed-check-in ladder (Journey 3), but this is
        │         a genuinely SEPARATE check-in system (own socket events:
        │         checkin:update/missed/started/stopped, own service calls,
        │         confirmed not sharing code with tripService or
        │         useTripMonitor)
        │       Live updates via checkin:* socket events (bound with a
        │         100ms-delayed second bind() call — see Gaps)
        │
        ├── Alerts tab
        │     SosGuardianIncomingAlerts (GuardianAlertsContext — SAME
        │       component/context as the Circle tab of /sos in Journey 1;
        │       "I'm responding" → POST /sos/:id/acknowledge)
        │     DashboardActiveSosPanel (same component as Overview tab,
        │       rendered a second time here)
        │     SosRecentHistory (GET /sos/history — same component as /sos's
        │       History tab)
        │
        └── Tools tab
              DashboardToolLinks (static link grid to other safety pages,
                activeEmergencyCount passed through from GET /emergency/active)
```

### Prose walkthrough

`/safety/manage` is genuinely a six-tab operational hub, not a single screen, exactly as Step 4 flagged — but the hash-deep-link scheme only round-trips cleanly for four of the six tabs. On load, `tabFromHash()` reads `window.location.hash` once and also re-runs on every `hashchange`, so a bookmarked or shared link like `/safety/manage#checkins` does land on the correct tab; three tabs (`overview`, `tools`, and `guardians`) only have one hash each written back by the page itself, while the Circle tab is written as `#status` (never `#linkers`, despite `#linkers` being accepted on read) and the Alerts tab is written as `#alerts` (never `#history`, despite `#history` also being accepted on read).

Guardian management and Safety Circle are two parallel but explicitly distinct systems, and the UI goes out of its way to disambiguate them (`GuardianVsCircleExplainer`, rendered on both tabs): a **Guardian** receives real-time SOS and trip alerts and requires an explicit request/accept handshake (`POST /guardians/request` → the other person sees it in their own Incoming requests list → `POST /guardians/respond`), while a **Circle** member only sees a status snapshot the user chooses to publish (`POST /status/update`), with no location or emergency-alert delivery attached. Both invite flows independently reuse the same "mutual followers only" pattern (intersecting `/follow/:id/followers` and `/follow/:id/following`) but as two separate, non-shared fetches — a user who's already loaded their mutual-follow list on the Guardians tab has to load it again from scratch on the Circle tab.

The Check-ins system (wellness pings on a fixed interval, escalating to a silent SOS after 3 misses) is confirmed as a third, independent escalation ladder alongside SOS (Journey 1) and Safe Trips' missed-check-in ladder (Journey 3) — same eventual silent-SOS convergence, but its own socket namespace (`checkin:*`) and its own service calls, not shared code. The Alerts tab is where a **guardian** (not the tracked user) reviews incoming SOS/emergency alerts from people who've added them as a guardian — this reuses the exact same `GuardianAlertsContext`/`SosGuardianIncomingAlerts` component that also appears in the Circle tab of `/sos` itself (Journey 1's cross-reference), so a guardian has two independent places in the app to see and acknowledge the same incoming alert. The Overview tab's `DashboardActiveSosPanel` is the tracked user's own live SOS status — same `SosContext`, same "Full timeline" deep link into `/safety/incident/[id]`, as Journey 1 — and is deliberately rendered a second time inside the Alerts tab, meaning a user viewing their own active SOS sees the identical panel twice depending which tab they're on.

## Cross-references

- Journey 1 (SOS activation): `DashboardActiveSosPanel` (rendered on both Overview and Alerts tabs) is the exact same `SosContext`/`useSos()` state machine, same `/safety/incident/[id]` recap deep link, same guardian "I'm responding" acknowledge action via `GuardianAlertsContext`. Not re-traced here.
- Journey 3 (tracking): the Circle tab's guardian-facing components are conceptually parallel to (but implementation-distinct from) the Circle tabs on `/safety/kidnapping-tracking` and `/safety/trips` — those pages have their own dedicated Circle tabs for discovering live tracking/trip sessions, whereas this hub's Circle tab is specifically about the wellness-status Safety Circle, a different feature with the same name pattern. Not re-traced here.
- Pages: `/safety/manage` (this hub), `/safety/dashboard` (pure redirect into it, per Step 5), `/sos` (shares `GuardianAlertsContext`/`SosGuardianIncomingAlerts`/`SosRecentHistory` components with this hub's Circle and Alerts tabs), `/safety/incident/[id]` (recap deep link).

## Gaps or inconsistencies found

1. **Confirmed, real deep-link asymmetry**: `HASH_TO_TAB` accepts `#linkers` and `#history` as read-side aliases for the Circle and Alerts tabs respectively, but `setTabWithHash()` (the function that updates the URL when a user clicks a tab in-app) only ever writes `#status` and `#alerts`. This means `#linkers` and `#history` are dead-on-write, live-on-read aliases — plausible legacy hash names kept for backward compatibility with old links, but a genuine asymmetry worth cleaning up or documenting in the rebuild (which of the two hash names is "canonical" is not obvious from the code alone).
2. **The Guardians-tab and Circle-tab mutual-follower lists are fetched completely independently** (`DashboardGuardiansPanel`'s `onLoadLinkers`/`dash.linkers` vs `DashboardCirclePanel`'s own internal `candidates` state) despite computing the exact same intersection of `/follow/:id/followers` and `/follow/:id/following` for the same logged-in user. No caching or sharing between them — a real, if minor, duplicate-fetch inefficiency.
3. **`DashboardCheckInsPanel`'s socket binding pattern is unusual**: it calls `bind()` synchronously on mount AND schedules a second `bind()` via `setTimeout(bind, 1000)` — binding the same five event handlers twice if the socket was already connected at mount time (the second `bind()` doesn't check whether the first already succeeded). This wouldn't literally double-fire because `socket.on()` on the same event/handler reference is idempotent in socket.io-client's default implementation only if the handler reference is identical, which it is here (`onUpdate` is stable across the 1s gap) — so this is very likely benign in practice, but it's a code-smell pattern not seen anywhere else in this cluster (no comment explains why a delayed second bind is needed) and should be understood, not just copied, in the rebuild.
4. **`GET /safety/status/me` failing and silently falling back is still unresolved from Step 4/this file's Journey 1-4 pass** — `DashboardLiveStatusPanel.loadMyStatus()` on the Circle tab hits this exact code path (confirmed, same finding as the API-page-matrix's Cross-cluster note #1, not a new discovery but directly relevant to this journey since it's the panel that triggers it on every Circle-tab visit).
5. **Window.confirm() reappears here as a UI pattern**, same as the Incident Report journey's `window.prompt()` — `DashboardCheckInsPanel`'s "Start check-ins" button uses a native `window.confirm()` dialog when a stopped schedule object already exists, rather than an in-app confirmation modal matching the rest of the dashboard's styled-card aesthetic. Minor, but consistent with a broader pattern of native browser dialogs leaking into an otherwise fully custom-styled app.

---

# Journey: Fake Call (`/safety/fake-call`)

## Trigger

Single entry point: `/safety/fake-call`, linked from the Sentinel feature catalog (`SENTINEL_FEATURES`, surfaced in `FeedSentinelRow`'s grid and presumably the `/safety` hub's tiles). File header comment states plainly: **"No backend involvement — purely client-side."** Confirmed directly from source — there is no import of `safetyService` or `apiClient` anywhere in `pwa/src/app/(app)/safety/fake-call/page.tsx`; the only external integrations are the Web Audio API (for the ringtone), `navigator.vibrate`, and a Capacitor local-notification scheduler (`scheduleLocalNotification`/`cancelLocalNotification`/`onLocalNotificationTapped`) for native-app backgrounding support.

## Flow

```
/safety/fake-call   (phase: 'setup')
        │
        │  Pick caller: 5 presets (Mum/Dad/Boss/Spouse/Doctor, each with a
        │  subtitle like "Mobile"/"Work"/"Clinic") OR type a custom name
        │  (free-text input, overrides preset selection)
        │
        │  Pick delay: Now(0s) / 5s / 15s / 30s / 1m
        │
        ▼
  "Ring now" (delay=0) ──────────────► beginRinging() immediately
        │
  "Schedule call" (delay&gt;0)
        │
        ▼
  phase: 'waiting'  (visible countdown banner, "Call in Ns…", Cancel button)
        │
        ├── TWO PARALLEL TIMERS armed simultaneously:
        │     1. In-page setInterval countdown (only fires if this tab
        │        stays open/foregrounded)
        │     2. Native OS-scheduled local notification via Capacitor
        │        (scheduleLocalNotification — fires even if app is
        │        backgrounded/screen locked; silently no-ops/returns null
        │        on plain web, where only mechanism #1 exists)
        │
        ├── user taps "Cancel" (during wait) ──► cancelWait():
        │      clears in-page timer, cancels the native notification if
        │      one was scheduled, phase → 'setup'
        │
        ├── in-page timer reaches 0 ──────────► beginRinging()
        │      (also cancels the native notification, since the in-page
        │       path already got there first — avoids a double-ring)
        │
        └── [app was backgrounded, native notification fires and is
             TAPPED by the user] ────────────► onLocalNotificationTapped
                callback restores callerName/callerSubtitle from the
                notification's own `extra` payload (since React state may
                have been lost if the page/app was fully suspended) →
                beginRinging()
                        │
                        ▼
              phase: 'ringing'  (FULL-SCREEN overlay, z-[100], covers
                entire viewport — dark gradient, caller avatar placeholder,
                caller name + subtitle, looping two-tone Web-Audio ringtone,
                navigator.vibrate pattern, "Ringing…" pulse text)
                        │
              ┌──────────┴───────────┐
              │                       │
              ▼                       ▼
        Decline (red button)    Accept (green button)
        → endCall()             → acceptCall():
          stops ringtone,         stops ringtone, phase → 'in-call',
          clears any timers,      starts a 1s-tick call-duration counter
          cancels native                   │
          notification if                  ▼
          still pending,          phase: 'in-call'  (same full-screen
          phase → 'setup'          shell, "On call" label, live MM:SS
                                    timer, single red "End call" button)
                                            │
                                            ▼
                                  Decline/End call → endCall()
                                  → stops timers/ringtone, phase → 'setup'
```

### Prose walkthrough

Fake Call is deliberately the simplest journey in this cluster: a user configures a caller identity (one of five presets, each with a plausible relationship subtitle, or a fully custom typed name) and a ring delay, then either rings immediately or arms a countdown. What makes this more than a naive `setTimeout` is the dual-scheduling design — the same delay is armed both as an in-page JavaScript timer (which only fires if the tab is still open and foregrounded) and, when running inside the Capacitor-wrapped native app, as a real OS-level scheduled local notification (which fires even if the app is backgrounded or the screen is locked). Whichever fires first wins and cancels the other, so a user who locks their phone right after scheduling the call still gets the ring at the right time via the native notification path, and if they tap that notification while the app is suspended, the handler restores the caller identity from the notification's own payload (since in-memory React state may not have survived a full suspend) and jumps straight to the ringing screen. On plain web (no Capacitor), `canScheduleLocalNotifications()` returns false and the page's own copy warns the user to keep the tab open and the screen unlocked, since only the in-page timer exists there.

The ringing and in-call states render as a genuine full-screen takeover (`z-[100]`, covering everything including any navigation chrome) with a synthesized two-tone ringtone built from raw Web Audio oscillators (no bundled audio asset) plus a vibration pattern, so the illusion holds even with the device muted. Accepting starts a live call-duration counter and swaps to a single "End call" control; declining or ending always returns cleanly to the setup screen, clearing every timer and cancelling any still-pending native notification so a stale ring can't fire later. Nothing about this feature reaches the backend at any point — no guardians are notified, no SOS or safety record is created; it exists purely as a private, on-device social-exit tool.

## Cross-references

- Pages: `/safety/fake-call` (the only page in this journey; fully self-contained).
- No cross-references into SOS, guardians, geofences, or any other safety system — confirmed by the complete absence of `safetyService`/`apiClient` imports. This is the one safety feature in the entire cluster that is genuinely and entirely local to the device.
- Uses `pwa/src/lib/capNotifications.ts` (`scheduleLocalNotification`, `cancelLocalNotification`, `onLocalNotificationTapped`, `canScheduleLocalNotifications`) — shared Capacitor notification helper, not otherwise traced in this journey since it's outside the safety-cluster's own service layer.

## Gaps or inconsistencies found

1. **No persistence of a scheduled fake call across a full app restart (not just backgrounding).** The native notification path survives backgrounding/lock, but if the app process itself is killed (not just backgrounded) before the scheduled time, there is no evidence in this file of the notification surviving a full process restart — Capacitor local notifications generally do persist at the OS level independent of the app process, so this is *likely* fine, but it was not independently verified against the Capacitor plugin's own guarantees this pass; flagged as an assumption, not a confirmed gap.
2. **The fixed notification id (`FAKE_CALL_NOTIFICATION_ID = 87301`) means only one fake call can ever be scheduled at a time** — confirmed by the comment itself ("arbitrary fixed id — only one fake call is ever scheduled at a time"). Scheduling a second call while one is already pending would silently overwrite/cancel-and-reschedule under the same id rather than queuing or erroring; not exercised as a distinct UI state (no "a call is already scheduled" warning shown if the user somehow navigates back to `/safety/fake-call` while `phase` was reset by a remount).
3. **No way to pre-configure a "quick" fake-call trigger from outside this page** (e.g., no widget, no shortcut from the SOS long-press, no lockscreen action) — a user in a genuinely uncomfortable live situation still has to navigate to this page, pick options, and wait out even the shortest delay (5s minimum, or "Now" for instant) before the ring appears; unlike the Panic PIN's disguised-URL pattern (Journey 4) or the SOS long-press (Journey 1), there is no faster/hidden invocation path for Fake Call specifically, despite it sharing the same "get out of a bad situation smoothly" premise. The in-page tip does suggest "long-press the Sentinel tab from anywhere in the app to jump straight here" as a partial mitigation, not independently verified against the bottom-nav long-press behavior this pass (that long-press is confirmed elsewhere in this document to trigger a silent SOS, not open Fake Call — see Journey 1 — so this in-page tip may itself be inaccurate; flagged, not fixed).

---

# Journey: Geofences (`/safety/geofences`)

## Trigger

Single entry point: `/safety/geofences`, linked from the Sentinel catalog and cross-referenced from `/safety/sentinel`'s "Related tools" grid. A geofence is created either by tapping "+ New zone" (opens a blank form) or by clicking directly on the map (`GeofenceMap`'s `onMapClick` prefills `latitude`/`longitude` from the click and opens the form automatically).

## Flow

```
/safety/geofences
        │
        │  GET /geofences on mount (and after every create/update/delete)
        │
        ├── Own raw socket.io-client connection (io(getSocketBaseUrl()),
        │     auth: {userId} at connect time — NOT the shared socketService
        │     singleton every other page in this cluster uses, confirmed
        │     same inconsistency Step 4 flagged for /safety/trips)
        │     listens: geofence:entry / geofence:exit / geofence:alert
        │     → prepended to a client-capped 20-item alerts[] list
        │     (only the first 5 rendered; each individually dismissible,
        │      client-side only — no "mark read" persistence call)
        │
        ├── "+ New zone" OR click-on-map ──► form opens (create mode, or
        │     edit mode via a card's "Edit" button, which prefills every
        │     field from the existing Geofence)
        │       │
        │       │  Name (required, max 100 chars)
        │       │  Latitude/longitude — editable number inputs, ALSO
        │       │    settable via "📍 Use my current location"
        │       │    (getGeolocation()?.getCurrentPosition, one-shot,
        │       │    not a live watch)
        │       │  Radius — slider, 50m–5000m (50m steps)
        │       │  Zone type — one of three, radio-style buttons:
        │       │    • safe_zone      — "confirm arrivals" framing
        │       │    • alert_zone     — "warn on unfamiliar areas" framing
        │       │    • restricted_zone — "high-risk... notifies guardians
        │       │                         automatically. Can trigger SOS"
        │       │  Four independent toggles:
        │       │    • notifyOnEntry (default true)
        │       │    • notifyOnExit (default true)
        │       │    • notifyGuardians (default false)
        │       │    • triggerSos (default false) — UI-DISABLED
        │       │        (opacity-30, pointer-events-none) UNLESS
        │       │        type === 'restricted_zone'; re-enabled the moment
        │       │        the user picks that type
        │       │
        │       ▼
        │  Submit → POST /geofences (create) or PATCH /geofences/:id (edit)
        │     → form closes, list reloads via loadGeofences()
        │
        ├── Per-zone card: colored dot by type (🏠/⚠️/🚨), label, type +
        │     radius, a status dot ("Inside"/"Outside"/"Unknown" — driven
        │     by fence.lastStatus, which is written SERVER-SIDE by
        │     whatever background process evaluates entry/exit; this page
        │     has NO client-side "am I inside this fence right now" check
        │     of its own), "Guardians alerted" badge if notifyGuardians,
        │     "Auto SOS" badge if triggerSos
        │       │
        │       ├── "Edit" → reopens form pre-filled
        │       └── "Delete" → window.confirm() → DELETE /geofences/:id
        │             → removed from local list immediately (optimistic)
        │
        └── 20-zone soft cap shown as running count ("N of 20 zones used")
              plus explicit battery-impact copy ("more zones... bigger
              battery impact") — not a hard client-side block, just a
              counter and warning text; no code path found that disables
              "+ New zone" once at 20
```

### Prose walkthrough

A user places a geofence either by tapping a blank "+ New zone" form or by clicking a point on the interactive map, which prefills the pin location directly. Every zone has one of three types, each carrying a materially different consequence, spelled out in the form's own description text: a **safe zone** confirms arrivals/departures (e.g., "I'm home" framing), an **alert zone** warns on unfamiliar-area entry, and a **restricted zone** is explicitly described as being able to notify guardians automatically and even trigger SOS. The `triggerSos` toggle itself is UI-gated to only be interactable when the zone type is `restricted_zone` — for the other two types the checkbox is visibly present but disabled and dimmed, so a user cannot accidentally arm an auto-SOS trigger on a merely "alert" zone.

Critically, **this page has no client-side logic that evaluates whether the user is currently inside or outside any of their own zones** — there's no `watchPosition` call, no distance-to-center calculation performed in this component at all. The "Inside"/"Outside"/"Unknown" status dot on each zone card is entirely a read of `fence.lastStatus`, a field the backend must be populating from some other process. The matrix's own cross-cluster note flags `POST /safety/geofences/check` ("Background GPS ping from the PWA service worker") as having no caller anywhere in the traced `src/app`/`src/hooks`/`src/services` scope — this journey's trace confirms that finding still holds from this page's own source: geofence crossing detection is not something `/safety/geofences` itself drives; it must happen either via a service worker (plausible, not independently verified this pass) or entirely server-side against periodically-reported location data from elsewhere in the app (e.g., the SOS active-tracking heartbeat, trip pings, or kidnapping-tracking pings — none of which explicitly reference geofence-checking in their own code as traced in the existing four journeys). Live alerts (`geofence:entry`/`exit`/`alert` socket events) do arrive and render as a dismissible, client-capped list at the top of the page — so crossing detection clearly happens somewhere, just not verifiably in this page's own client code.

When it does connect to guardians or SOS, it's exactly as advertised: `notifyGuardians` piggybacks on the same guardian-notification mechanism the rest of the safety cluster uses (not independently re-verified against `safety.service.ts`'s guardian-fanout logic this pass), and `triggerSos` on a restricted zone is described as able to actually create a real SOS event — this would, if true, be a genuinely automatic trigger with zero manual action required at the moment of crossing, structurally similar to the Safe Trips missed-check-in escalation (Journey 3) and the Check-ins ladder (Journey 6) in that it's a background/passive path into the same `SosEvent` system as Journey 1, but unlike those two, this page's frontend never actually confirms whether a `triggerSos`-flagged zone crossing produced a real, trackable SOS the user can see reflected in `SosContext` — there's no visible link from a `geofence:alert` payload back to an `sosEventId`.

## Cross-references

- Journey 1 (SOS activation): `triggerSos` on a restricted zone is described in-UI as capable of auto-triggering a real SOS, structurally analogous to the trip-escalation auto-trigger already documented there, but this specific link was not independently confirmed to actually surface in `SosContext`/`activeSos` state from this page's own source.
- Guardians: `notifyGuardians` reuses the same guardian-fanout concept as `/safety/manage`'s Guardians tab and Journey 1's guardian notification path — not independently re-traced.
- Pages: `/safety/geofences` (this journey, self-contained CRUD + map + live feed).
- Same architectural inconsistency as `/safety/trips` (Journey 3's Gap #2, per the API matrix's Cross-cluster note #2): this page opens its own direct `socket.io-client` connection rather than using the shared `socketService` singleton, with yet another distinct auth-handshake shape (`auth: {userId}` at connect time) different from both `/safety/trips`'s post-connect `emit('authenticate', token)` pattern and the shared singleton's own pattern — a third distinct socket-auth convention now confirmed across just these two pages.

## Gaps or inconsistencies found

1. **Confirmed from source**: no client-side geofence-crossing evaluation exists on this page at all — `fence.lastStatus` is purely a server-reported field, and the background-ping endpoint that would presumably drive it (`POST /safety/geofences/check`) has no caller anywhere found in this pass either, consistent with the API matrix's own flag. Whatever mechanism actually evaluates crossings (service worker, or piggybacking on some other feature's location pings) is invisible from this page's own code and was not independently traced to ground truth this pass.
2. **No visible confirmation that a `triggerSos`-flagged restricted-zone crossing produces a `SosEvent` the user can see in `SosContext`.** The live alert feed shows a `geofence:alert` toast-like entry, but nothing in this page cross-references `sos.activeSos` or navigates to `/sos`/`/safety/incident/[id]` when such an alert fires — a user relying on this feature to auto-trigger SOS on entering a dangerous area has no in-page confirmation the SOS side actually activated, only the geofence alert itself.
3. **Same un-unified socket pattern as Journey 3's Gap #2** — now confirmed present on a third page (`/safety/trips`, and by extension `useTripMonitor`, plus this page), each with its own distinct connect/auth shape, reinforcing that this is a cluster-wide pattern worth consolidating in the rebuild rather than a one-off.
4. **The 20-zone cap is soft/advisory only** — the running counter and battery-impact copy are the only friction; no code path was found that disables "+ New zone" or the form's submit button once the count reaches 20, so the actual enforcement (if any) must be server-side, unverified this pass.
5. **Dismissing a live geofence alert from the on-page feed is client-side/session-only** — no persistence call (no `markAsRead`-equivalent) is made when a user dismisses one of the five visible alerts, unlike the Sentinel red-zone alert dismissal (Journey 5), which does at least attempt server persistence when a `notificationId` is available. A user who dismisses a geofence alert and reloads the page would see it reappear if it's still within the most-recent-20 socket-received window — not independently confirmed since the alerts array is populated only from live socket events during the current session (no history-fetch call exists in this page), meaning a fresh page load actually starts with an empty alert list regardless, softening this particular gap's practical impact.

---

# Journey: Community-wide emergency awareness (`/community-emergency` + `/map`)

## Trigger

**`/community-emergency` and `/safety/emergency` are confirmed, independently, from this page's own file-header comment, to be two entirely separate systems**: `/community-emergency` is a resident-posted **community feed post** (crime/danger/missing person/fire/accident/suspicious activity, with a title/body/severity and reaction buttons), backed by `content.service.ts` (`POST /content/emergency`, `GET /feed?contentType=emergency`) — not `safety.service.ts` at all. `/safety/emergency` (already documented in Step 4's matrix, not part of this journey) is the "Legacy Emergency" SOS-adjacent dispatch-log system. A user becomes aware of an active community emergency one of three ways, all independently confirmed this pass: (1) browsing directly to `/community-emergency`, (2) a pulsing ring around the floating SOS button (`FloatingSosButton`, present on nearly every `(app)` page) driven by `useNeighborhoodEmergency()`, or (3) the `RedZoneBanner`/Sentinel advisory path from Journey 5, **if and only if** a Sentinel-detected threat happens to also correlate with a community-posted emergency — these are not the same pipeline and there is no code linking them.

## Flow

```
A resident posts a community emergency:
/community-emergency → "Post alert" (auth required; unauthenticated
  users see a sign-in prompt, no create form)
        │
        │  Emergency type (6 options: crime/danger/missing_person/fire/
        │    accident/suspicious_activity) + Severity (low/medium/critical)
        │    + optional title + required body (≥10 chars) + optional
        │    address/LGA
        │  In-form copy warns: "This will immediately alert your
        │    community. Only post real emergencies — up to 3 per hour"
        │    (rate limit stated in copy, NOT independently verified
        │    against backend this pass)
        │
        ▼
  POST /content/emergency → toast success → form closes, feed reloads

                    ┌───────────────────────────────────────────┐
                    │  How OTHER users become aware:              │
                    └───────────────────────────────────────────┘

  PATH 1: Direct browse
  /community-emergency → GET /feed?contentType=emergency (paginated,
    infinite scroll) → EmergencyCard list, each showing type/severity
    badges, body, location, an expiry countdown (getExpiryCountdown,
    client-computed from expiresAt, "Expired" styling once past),
    and three reaction buttons: "I'm Aware" / "Nearby" / "I'm Safe"
    → POST /content/posts/:id/{aware,nearby,safe} (optimistic count
    update, toggle-off on re-tap)

  PATH 2: Passive ambient awareness — FloatingSosButton's ring
  useNeighborhoodEmergency() (polls GET /feed?contentType=emergency,
    limit 5, every 60s, from ANY page in the app — this hook is mounted
    inside FloatingSosButton, which is globally rendered) → returns a
    plain boolean (hasActive) → if true, the SOS button's ring gets the
    '--live' CSS class (same visual state as an ACTUALLY ACTIVE personal
    SOS — see Gaps) instead of '--idle'
        │
        │  Tapping the button while this ring is lit still does its
        │  NORMAL short-tap thing: router.push('/sos') — NOT a
        │  navigation to /community-emergency. The ring gives no
        │  indication of WHAT is active (a community emergency vs the
        │  user's own SOS vs nothing) and provides no path to the
        │  actual emergency post.
        ▼
  User must independently know to browse to /community-emergency to see
  what's actually going on (no deep link, no toast, no notification
  confirmed connected to this specific hook)

  PATH 3 (partial/unconfirmed): Sentinel red-zone advisory (Journey 5)
  MAY surface a related toast/banner if Sentinel independently scores a
  correlated threat as high-severity — no code path found that treats a
  community-emergency POST as an input to Sentinel's own scoring, so this
  is speculative overlap, not a confirmed pipeline connection.


/map — SEPARATE FEATURE, NOT a safety/incident map
        │
        │  Confirmed by direct source read of MapComponent.tsx: ZERO
        │  references anywhere in the file to emergency, incident,
        │  red-zone, safety, or sos (case-insensitive grep, no matches).
        │
        ├── People layer: GET /geo/nearby/users — other users' published
        │     locations (own location published via PUT /auth/location/
        │     update, throttled to 1/90s except an immediate first publish)
        ├── Places layer: GET /geo/places, GET /geo/places/:lga/stats —
        │     LGA-level aggregate stats, not incident data
        └── MapSelectionSheet — tapping a marker shows a profile/place
              card with follow/unfollow actions, nothing safety-related

  CONCLUSION: /map is a pure people/places discovery map. It has NO
  overlay for community emergencies, no red-zone shading, no incident
  markers, and no connection whatsoever to /community-emergency,
  /safety/sentinel, or /incident-reports. A user cannot see "where is
  the active emergency" on this map — the only way to learn an
  emergency's location is the address/LGA text field on the
  EmergencyCard itself, back on /community-emergency.
```

### Prose walkthrough

A resident posts a community-wide emergency alert from `/community-emergency` — a fully separate system from personal SOS/Emergency dispatch, confirmed by the page's own header comment and by the fact that it goes through `content.service.ts` rather than `safety.service.ts`. The create form requires picking one of six emergency types and one of three severities, a body of at least 10 characters, and optionally an address/LGA and title; in-form copy claims a 3-per-hour rate limit, which was not independently verified against backend source this pass. Once posted, the alert becomes a normal, paginated feed entry filtered to `contentType=emergency`.

Community-wide awareness of an active emergency happens through two genuinely different, unconnected mechanisms. The primary, information-bearing path is simply browsing `/community-emergency` directly and reading the feed — each card shows the type, severity, an auto-computed expiry countdown, and lets any signed-in viewer react with "I'm Aware," "Nearby," or "I'm Safe" (each a simple optimistic toggle). The second, ambient path is a background 60-second poll (`useNeighborhoodEmergency`) that is mounted inside the **floating SOS button itself** — not, despite its own code comment's claim, inside `BottomNav.tsx` (confirmed by directly reading `FloatingSosButton.tsx`'s imports and usage; the comment in the hook file appears to be stale/inaccurate). When this poll finds at least one active emergency post, the SOS button's outer ring switches to the identical `--live` visual state used when the **user's own personal SOS is genuinely active** (`visiblyActive`) — there is no visual distinction between "a community emergency exists somewhere nearby" and "you personally have an active SOS right now." Worse, tapping the button in this state does not navigate to the emergency feed at all — a short tap always just routes to `/sos`, regardless of which condition lit the ring. A user would have to already know to separately browse to `/community-emergency` to discover what triggered the ring; the ring itself carries no information beyond "something is active."

`/map`, despite living in the same general "safety-adjacent" mental category as the rest of this cluster, turns out to be an entirely unrelated feature on direct source inspection: a Leaflet-based people/places discovery map (nearby users you can follow, LGA-level aggregate place stats), with a zero-hit grep for any emergency/incident/red-zone/safety/sos terminology anywhere in `MapComponent.tsx`. It is not a red-zone map, not an incident map, and has no overlay of active community emergencies, Sentinel advisories, or incident reports — despite being a natural candidate for exactly that. The only way to learn *where* an active community emergency is happening is the free-text address/LGA field on the `EmergencyCard` itself; there is no map view of it anywhere in the app.

## Cross-references

- Pages: `/community-emergency` (post/browse/react), `/map` (unrelated people/places discovery map — confirmed no safety overlay of any kind).
- `FloatingSosButton` (`pwa/src/components/sentinel/FloatingSosButton.tsx`) is the actual mount point for `useNeighborhoodEmergency()` — cross-references Journey 1, since this is the same component whose long-press triggers a real silent SOS and whose short-tap routes to `/sos`; the neighborhood-emergency ring state and the personal-SOS-active ring state are visually identical (`--live` class either way).
- No cross-reference exists to `/safety/sentinel` (Journey 5), `/incident-reports`, or `/safety/emergency` — confirmed independent systems, no shared service calls, no shared components, no code-level bridge found between a community-emergency post and any of those three.
- `contentService.confirmOrDispute(postId, action)` exists in `content.service.ts` (`POST /content/posts/:id/confirm-dispute`) but is **not called anywhere in `/community-emergency`'s page source** — only `toggleImAware`/`toggleImNearby`/`toggleSafeMark` are wired up; a confirm/dispute mechanism analogous to the Incident Report journey's witness/confirm/dispute pattern (existing Journey 2) appears to exist server-side/service-side but has no UI entry point on this page.

## Gaps or inconsistencies found

1. **Confirmed, real UX gap**: `useNeighborhoodEmergency`'s own file-header comment claims it's "Used to light up the SOS ring on BottomNav" — directly contradicted by source, since it's actually consumed inside `FloatingSosButton.tsx`, a visually and functionally distinct component from `BottomNav.tsx` (confirmed both files exist separately and `FloatingSosButton` is the only importer of this hook). Stale/inaccurate comment, worth correcting regardless of functional impact.
2. **Confirmed, more serious gap**: the neighborhood-emergency ring state (`hasNeighborhoodEmergency`) and the user's own active-personal-SOS ring state (`visiblyActive`) are combined with a plain OR into the identical CSS class (`--live` vs `--idle`) with no other visual differentiation anywhere on the button. A user glancing at a lit SOS ring cannot tell, from the button alone, whether it means "something is happening in your neighborhood" (low personal urgency, informational) or "your own SOS is currently active" (maximally urgent, self-referential) — and tapping it does the same thing either way (navigate to `/sos`), which is actively unhelpful for the neighborhood-emergency case since `/sos` has no content about community emergencies at all.
3. **No deep link from the SOS ring (or anywhere else app-wide) into `/community-emergency`.** A user who notices the lit ring and taps through lands on `/sos`, sees nothing explaining why the ring was lit, and has no signposted next step toward the actual community-emergency feed — they'd need to already know this feature exists and navigate there independently (e.g., via the bottom nav's Safety/Sentinel entry point, if one exists there, not independently traced this pass).
4. **`/map` has no safety/incident/emergency overlay of any kind, despite being a plausible, arguably expected, home for exactly that.** Confirmed via a zero-match case-insensitive grep across `MapComponent.tsx` for `emergency|incident|red.?zone|safety|sos`. A user cannot see active community emergencies, Sentinel red-zone advisories, or open incident reports spatially anywhere in this app — the closest thing to a map view of danger is the free-text address/LGA field on individual `EmergencyCard`s, with no pin/marker representation.
5. **`confirmOrDispute` is dead code from this page's perspective** — defined in `content.service.ts`, never called from `/community-emergency`'s `page.tsx`. Whether this was intentionally descoped (aware/nearby/safe reactions being considered sufficient) or is a genuine missing feature (a false/malicious emergency post has no confirm/dispute mechanism visible to users, unlike the analogous and fully-wired witness/confirm/dispute pattern on Incident Reports, existing Journey 2) could not be determined from the frontend alone.
6. **The in-form "up to 3 per hour" rate-limit claim is UI copy only** — no client-side counter, cooldown timer, or disabled-state was found enforcing it; if real, enforcement must be entirely server-side (a 4th post attempt would presumably fail with a generic error toast, matching the same "no client-side pre-check" pattern already observed for Incident Reports' `requireVerified` gate in the existing Journey 2).

---

# Journey: Legacy Emergency — report → active tracking → escalate/resolve/cancel → replay

## Trigger

**Confirmed from source: `/safety/emergency` is not orphaned — it is a genuinely well-linked, multiply-reachable page**, despite being labeled "Legacy" in Step 4's matrix (that label refers to the dispatch mechanism being pre-automation, not to the page being unmaintained or unlinked). A direct repo-wide search for `safety/emergency` turns up real `<Link>`/`href` call sites from at least seven distinct places, none of which are the page's own file:
1. **`sentinel-catalog.ts`** — the shared feature catalog entry (`id: 'emergency'`, `href: '/safety/emergency'`, tab: `'tools'`) that powers the Sentinel hub's feature grid (`/safety` page).
2. **`SosQuickActions.tsx`** (Prepare-tab component on `/sos`) — a second, independently-defined catalog entry (`id: 'emergency'`, label "Emergency contacts") pointing to the same href.
3. **`DashboardToolLinks.tsx`** (`/safety/manage`'s "Advanced tools" grid) — links here as "Report emergency," and additionally shows a live **unread-count badge** sourced from `activeEmergencyCount` (itself from `useSafetyDashboard()`'s `GET /safety/emergency/active` call) when there's at least one active emergency.
4. **`/safety/sentinel/page.tsx`** — two separate links: one in the "Related tools" grid (per Journey 5), and one inline in the "How it works" copy ("For immediate danger, use SOS or Emergency report").
5. **`SosGuardiansNotifiedCard.tsx`** (shown on `/sos` once `notifyMeta` exists) — a conditional "Emergency record" chip, shown only when `notifyMeta.emergencyId` is set, i.e. this specific SOS trigger also produced a linked Emergency document.
6. **`SosGuardianIncomingAlerts.tsx`** (Circle tab of `/sos`, guardian-facing) — falls back to an "Emergency dashboard" link whenever an incoming alert has **no** `sosEventId` (this is the guardian's only path into an emergency-only alert that isn't also a real SOS).
7. **`GuardianAlertsContext.tsx`** — the live socket-driven toast shown to guardians on `safety:emergency_alert` has a "Respond" action that does `window.location.href = alert.sosEventId ? '/safety/incident/${sosEventId}' : '/safety/emergency'` — i.e. **this page is the guardian's real-time landing target** whenever an incoming emergency alert isn't also tied to a full SOS event.
8. **`ChatActionMenu.tsx`**'s `EmergencyShareModal` — a chat-attachment flow letting a user share one of their own past emergency reports (fetched via the same `safetyService.getRecentEmergencies()` the page itself uses) into any conversation as an `emergency_share` message type.

This is a materially different picture from `/premium` in the commerce cluster: `/safety/emergency` has multiple independent, live, data-driven (not just static-copy) entry points across three different surfaces (Sentinel hub, SOS command center, guardian alert delivery, chat sharing) — it is a first-class, reachable feature, just one whose backend dispatch integration is explicitly unfinished. The "Legacy" label in the matrix is about the underlying `Emergency` document's simpler pre-SOS data model and its lack of real agency dispatch, not about the page being dead.

## Flow

```
ENTRY POINTS (any of):
  • Sentinel hub (/safety) feature grid → sentinel-catalog.ts 'emergency' entry
  • /sos Prepare tab → SosQuickActions "Emergency contacts"
  • /safety/manage "Advanced tools" → DashboardToolLinks "Report emergency"
      (badge shows live activeEmergencyCount when > 0)
  • /safety/sentinel hub → "Related tools" grid + inline "How it works" copy
  • /sos (after an SOS produces a linked Emergency) → SosGuardiansNotifiedCard
      "Emergency record" chip (only when notifyMeta.emergencyId is set)
  • Guardian-facing: safety:emergency_alert socket toast "Respond" action
      → window.location.href = '/safety/emergency' (when alert has NO sosEventId)
  • Guardian-facing: SosGuardianIncomingAlerts Circle-tab card → "Emergency
      dashboard" chip (same no-sosEventId fallback case)
  • Chat: ChatActionMenu → EmergencyShareModal (share a PAST report, not a
      live navigation into the page itself)
        │
        ▼
┌───────────────────────────────────────────────────────────────────────┐
│  /safety/emergency  (single page, inline JSX, no sub-routes)           │
│  On mount: GET /emergency/active, GET /emergency/history(10),          │
│  GET /emergency/stats — three independent panels, independent          │
│  loading/error handling per panel                                      │
└───────────────────────────────────────────────────┬─────────────────────┘
                                                      │
        ┌─────────────────────────────────────────────┼───────────────────────────────┐
        │                                             │                               │
        ▼                                             ▼                               ▼
  REPORT FORM                              ACTIVE / STATS PANELS              PER-EMERGENCY ACTIONS
  (bottom of page, always visible)         (top of page, conditional)         (on each active-status card
                                                                                in Recent Emergencies list)

  14-type icon grid (armed_robbery,        Active Emergencies panel:          escalate() — only shown when
  kidnapping, fire x2 variants,            renders while activeLoading OR     !agencyNotified
  medical x2, accident, crime,             active.length > 0; each card       POST /emergency/:id/escalate
  natural_disaster, security,              shows type icon, description/      → button copy IS EXPLICIT:
  harassment, sos, panic_button,           address, source badge (manual      "Mark as logged (not a real
  other) — each pre-mapped client-side     report/manual SOS/trip monitor/    dispatch)" — server response
  to a display-only "assigned agency"      geofence), and a dispatchStatus    includes a synthetic
  (NPF/DSS/Fire Service/NEMA/FRSC) —       badge with an explicit tooltip:    agencyResponse {success,
  this mapping is CLIENT-SIDE COSMETIC    "Automatic agency dispatch isn't   referenceId, agencyName}
  ONLY, real assignedAgency comes back    connected yet — this only          object, but the page never
  from the server on submit               reflects our internal record"     reads/displays it — only
        │                                                                    re-calls loadHistory()
  Severity (low/med/high/critical,        Your emergency history stats:      afterward
  buttons not a dropdown) — high/          5-tile grid: total, active,
  critical shows inline warning           resolved, false alarms, avg       resolve() — always available
  reiterating "call the number shown       resolution time (minutes)         POST /emergency/:id/resolve
  after submitting"                                                          → { status: 'resolved' }
                                                                               (page passes this fixed
  Description (optional, <=500 chars)                                        payload itself, not user-
                                                                               editable)
  Reporter contact phone (optional,
  "shared with agency" — though no                                          cancel() — always available,
  real agency integration exists to                                          explicit "Never mind, that
  share it WITH, so this copy is                                             was a mistake" semantics
  aspirational/for the record only)                                          POST /emergency/:id/cancel
                                                                               { reason: 'Reported by
  Submit → getGeolocation() REQUIRED                                         mistake' } — reason is
  (unlike SOS's fallback-to-last-known,                                      HARDCODED, not user-entered
  this form hard-fails with an inline
  error if geolocation isn't supported                                      acknowledge() — idempotent
  or the browser denies/times out —                                          per-id, tracked in a local
  no offline queue, no retry, no                                             Set (acknowledgedIds) —
  optimistic local record; a failed                                          once acknowledged, button
  GPS fix means the report is simply                                         freezes to "Acknowledged"
  NOT submitted)                                                             with no unacknowledge path
        │                                                                    POST /emergency/:id/
        ▼                                                                    acknowledge — DISTINCT from
  POST /emergency/report                                                     SOS's own /sos/:id/acknowledge
  { type, severity, description,                                             (guardian "I'm responding");
    location:{lat,lng,address},                                              this one has no visible
    reporterContact, deviceInfo:                                             guardian-vs-self distinction
    {userAgent, accuracy, triggeredAt} }                                     in the UI — ANY viewer of
        │                                                                    this page (the reporter
        ▼                                                                    themself, in practice) can
  Response: { report: Emergency,                                             tap it
    conversationId: string|null,        [ALL FOUR actions available to
    agencyContact:{agency,number,note}  whoever is viewing this page while
    |null }                              signed in — the page performs NO
        │                                role/ownership check client-side;
        ▼                                who can actually act is presumably
  Success banner:                        enforced server-side, not verified
  "Emergency logged" +                   this pass]
  assignedAgency (real, from server)
  + IF agencyContact present:
    "This has NOT been sent to any
    agency automatically. Call
    {number} ({agency}) yourself
    right now if this is urgent"
    with a live tel: link
  + IF agencyContact absent:
    generic "call 112 yourself" copy
  + Emergency ID shown, dismiss button

  NOTE: `conversationId` IS returned
  by the backend (an incident
  conversation may be created, mirroring
  SOS's own incident-conversation
  pattern per Journey 1's cross-refs)
  but the page NEVER reads or surfaces
  it anywhere — no "Open conversation"
  link exists on this page at all
  (see Gaps)

        │
        ▼
  loadHistory() + loadActive() re-fetch
  → new report appears in Active panel
    (if status === 'active') and
    Recent Emergencies list


REAL-TIME UPDATES (safety:emergency_dispatch_update socket event)
────────────────────────────────────────────────────────────────
  socketService.getSocket()?.on('safety:emergency_dispatch_update', ...)
  — uses the SHARED socketService singleton (NOT a raw io() instance —
  this page does NOT repeat the /safety/geofences or /safety/trips
  "own separate socket connection" inconsistency)
  — bound on mount, with a defensive re-bind via setTimeout(bind, 1000)
    in case the socket connects slightly after this effect runs
  — payload: { emergencyId, dispatchStatus, assignedAgency, dispatchedAt }
  — patches ALL THREE local state slices in lockstep: active[], history[],
    AND submitted (the just-created record in the success banner, if
    still shown) — so a dispatch-status change is reflected everywhere
    it's currently displayed, not just one list
  — side effect: if dispatchStatus becomes 'sent', the patch ALSO flips
    the emergency's status to 'responding' client-side (a derived,
    client-computed transition, not something the server payload states
    directly as a `status` field)


INCIDENT REPLAY (unique to this page — not present in any other journey)
──────────────────────────────────────────────────────────────────────
  Per-emergency "View Incident Timeline" button on every history-list
  card (hidden only for type === 'false_alarm')
        │
        ▼
  GET /emergency/:id/replay  (safetyService.getIncidentReplay)
  Access per service-file comment: "the victim, their accepted guardians,
  and admins" — NOT independently verified against backend source this
  pass, taken on trust from the comment
        │
        ▼
  IncidentReplay shape:
  { emergencyId, emergencyType, severity, startedAt, resolvedAt,
    durationSeconds, status, assignedAgency,
    summary: { totalEvents, locationPings, chatMessages, systemEvents,
               clockDriftFlaggedPings, hasIncidentConversation },
    timeline: TimelineEntry[] }
  where each TimelineEntry = { timestamp, type: 'location_ping'|
    'chat_message'|'system_event', source, data: Record<string,any>,
    clockDriftFlagged? }
        │
        ▼
  Rendered as:
  • 4-tile summary grid (Total Events / Location Pings / Chat Messages /
    System Events) — raw counts, no chart/graph
  • Clock-drift warning banner — shown ONLY if
    summary.clockDriftFlaggedPings > 0: "N location ping(s) flagged
    for clock drift — timestamps may be inaccurate." This is a genuinely
    unusual, forensic-grade caveat: it tells the viewer some of the
    location pings in the timeline below may have unreliable timestamps
    (e.g. device clock skew), and is surfaced BEFORE the timeline itself
    so the viewer reads it as a framing caveat, not a footnote.
  • Unified, single chronological timeline — location pings, chat
    messages, and system events are ALL merged into one ordered list,
    not three separate tabs/panels. Each row's display text falls back
    through `data.content` → `data.event` → `data.address` → a generic
    `"{source} · {type}"` string, i.e. the frontend has no per-type
    dedicated renderer, just an ordered "best available label" cascade —
    location pings show an address if present, chat messages show their
    content, system events show an event name.
  • Per-entry clock-drift flagging: any individual entry with
    clockDriftFlagged=true gets a distinct amber/yellow highlight and an
    inline "drift" tag next to its HH:MM:SS timestamp (rendered with
    second-level precision, `toLocaleTimeString` with explicit
    hour/minute/second — the only place in this page, or arguably this
    whole cluster, where second-level time display appears; every other
    "recency" indicator in the cluster uses coarser relative-time
    or date+time-without-seconds formatting)
  • Per-emergency open/loading/loaded/failed state tracked in three
    parallel id-keyed dicts (replayOpen, replayLoading, replayData) —
    multiple emergencies' timelines could theoretically be open at once,
    since state is keyed by id rather than a single "currently open" id
  • Toggle button re-reads existing state on second tap (collapses
    in place rather than re-fetching) UNLESS replayData[id] is still
    undefined, in which case it re-fetches
  • Failure state: a bare "Failed to load timeline." text row — no
    retry button, no distinction between "network error" and "you don't
    have access" (403 vs 5xx are not differentiated in the UI)
```

### Prose walkthrough

`/safety/emergency` is reachable from a genuinely wide set of real, data-driven entry points spanning three different parts of the app — the Sentinel feature-discovery hub, the SOS command center's Prepare tab and post-trigger guardian-notification card, the Sentinel management dashboard's tool grid (with a live unread-count badge), the Sentinel AI advisory hub's "for immediate danger" copy, a guardian-facing real-time socket toast, and a chat-sharing flow for past reports — confirming this is not an orphaned or dead page despite its "Legacy" label in the API matrix; that label describes the underlying data model and dispatch mechanism, not the page's reachability.

The report form asks for an emergency type (14 icon-buttons spanning armed robbery through a generic "Other," each pre-mapped **client-side only** to a cosmetic "assigned agency" label like NPF or NEMA — the real `assignedAgency` returned by the server on submit is what's actually shown afterward, not this client-side guess), a severity level (button row, not a dropdown, with inline warning copy on high/critical reiterating that dispatch is manual), an optional description and reporter contact phone, and then — on submit — a **hard-required** GPS fix: unlike the SOS trigger flow (Journey 1), which falls back to a last-known location and queues offline if GPS or connectivity fails, this form has no such resilience — a denied or timed-out geolocation permission simply fails the whole submission with an inline error, no retry, no offline queue. On success, `POST /safety/emergency/report` returns the created report, an optional `agencyContact` (a real phone number and note to call directly), and a `conversationId` — but the page reads only the first two; `conversationId` is fetched and then silently discarded, meaning there's no in-page way to jump into whatever incident conversation the backend may have created, unlike SOS's fully-wired incident-conversation pattern. The success banner is explicit and repeated in multiple places on this page (form warning copy, success banner, per-active-emergency dispatch-status tooltip) that nothing has been automatically sent to any agency — "logged, not real dispatch" concretely means: the record exists in the app's database, a cosmetic/best-effort agency label is attached to it, and a real phone number is surfaced for the user to call themselves; no outbound call, SMS, or API integration to NPF/NEMA/DSS/Fire Service/FRSC exists anywhere in this flow.

The Active Emergencies and stats panels are read-only aggregates (`GET /emergency/active`, `GET /emergency/stats`), each independently loading and independently able to fail (swallowed to an empty/null state, no shared error boundary). Per-emergency actions — escalate, resolve, cancel, acknowledge — are all rendered on every `status === 'active'` card with **no client-side role or ownership check at all**: the page does not distinguish "you are the reporter," "you are a guardian," or "you are just viewing this list" before showing the action buttons, unlike the Incident Reports journey's explicit `isReporter` gate (Journey 2). Escalate's button copy is the most explicit "not real" language anywhere in the cluster ("Mark as logged, not a real dispatch"), and although the server's response includes a synthetic `agencyResponse` object (`success`/`referenceId`/`agencyName`), the frontend never displays it — the button's only visible effect is a re-fetch of the history list. Resolve and cancel both send fixed, non-editable payloads (`{status:'resolved'}` and `{reason:'Reported by mistake'}` respectively) rather than letting the user type a reason, unlike Incident Reports' `window.prompt()`-based resolution text. Acknowledge is a separate, distinctly-named endpoint from SOS's own guardian-acknowledge action, tracked in a simple local `Set` with no un-acknowledge path once tapped.

Real-time dispatch-status changes arrive via `safety:emergency_dispatch_update` on the app's **shared** `socketService` singleton — a genuine design strength relative to `/safety/geofences` and `/safety/trips`, both of which open their own separate raw socket connections (a previously-flagged inconsistency in this cluster); this page does not repeat that mistake. A single incoming payload patches the active list, the history list, and the just-submitted success-banner record simultaneously, and derives a client-side `status: 'responding'` transition whenever `dispatchStatus` becomes `'sent'` — the server payload itself doesn't send a `status` field, only a `dispatchStatus`.

Incident Replay is unique to this page among all ten journeys — no other safety surface offers a forensic, merged timeline. It fetches `GET /emergency/:id/replay`, returning a unified chronological list of location pings, chat messages, and system events (not three separate tabs — genuinely interleaved by timestamp), a 4-tile summary count grid, and — the most distinctive detail — an explicit **clock-drift warning**: if any location pings were flagged server-side as having an unreliable timestamp (e.g. device clock skew), a banner appears above the timeline warning the viewer before they read it, and each individually-flagged entry gets its own amber highlight and inline "drift" tag next to a second-precision timestamp — the only place in the entire safety cluster where time is displayed down to the second. A rebuild needs to preserve: the unified single-timeline merge (not per-type tabs), the pre-timeline clock-drift caveat banner, the per-entry drift flagging with second-level timestamps, and the "best available label" text-fallback cascade (`content` → `event` → `address` → generic type label) since the underlying `data` shape varies by entry type and has no dedicated per-type renderer today.

## Cross-references

- Pages: `/safety/emergency` itself (this journey); `/safety` (Sentinel hub, feature-grid entry point); `/sos` (Prepare-tab `SosQuickActions` link, post-trigger `SosGuardiansNotifiedCard` conditional "Emergency record" chip, Circle-tab `SosGuardianIncomingAlerts` "Emergency dashboard" fallback for alerts with no `sosEventId`); `/safety/manage` (`DashboardToolLinks` "Report emergency" tile with a live active-count badge); `/safety/sentinel` (Related-tools grid + inline "How it works" copy, Journey 5); `/safety/incident/[id]` (the **other**, SOS-native incident-recap page — a guardian is routed to `/safety/incident/[sosEventId]` instead of `/safety/emergency` whenever an incoming alert **does** carry a `sosEventId`, making these two pages siblings in the same guardian-routing branch, not overlapping).
- Components: `GuardianAlertsContext` (`safety:emergency_alert` socket toast, "Respond" hard-navigation to `/safety/emergency` when no `sosEventId`), `SosGuardianIncomingAlerts`, `SosGuardiansNotifiedCard`, `DashboardToolLinks`, `sentinel-catalog.ts` (`getSentinelFeature('emergency')`), `ChatActionMenu`'s `EmergencyShareModal` (shares a past report by id into a chat message, reusing `getRecentEmergencies()`).
- Socket: `safety:emergency_dispatch_update`, bound via the shared `socketService` singleton — the correct pattern, contrasted with `/safety/geofences` and `/safety/trips`'s own raw `socket.io-client` connections (existing cross-cluster note, not repeated here).
- Relation to Journey 1 (SOS): a related but genuinely separate data model — an `Emergency` document (this journey) is a lighter-weight dispatch-log record, while an `SosEvent` (Journey 1) drives the full `SosContext` state machine (pending/active/resolved/cancelled, live location heartbeat, offline queue). They can co-occur and cross-link (`notifyMeta.emergencyId` on a real SOS trigger, `resolveSosEventId()` in `guardian-alerts.ts` checking `escalationDetails.sosEventId`/`linkedSosEventId` on an `Emergency` to see if it's SOS-linked) but are not the same resource — confirmed by the guardian-routing branch (`sosEventId` present -> `/safety/incident/[id]`; absent -> `/safety/emergency`) being the actual, executed logic for deciding which of the two pages a guardian lands on.
- Relation to Journey 5 (Sentinel): `/safety/sentinel`'s own "How it works" copy explicitly tells users to use SOS or Emergency report for immediate danger, and links to `/safety/emergency` from its "Related tools" grid — confirming Journey 5's flagged gap (no escalation path from a red-zone advisory into SOS/incident report) is a one-way absence: Sentinel links out to Emergency, but nothing links from an active Emergency/SOS back into Sentinel's threat-scanning context.
- Relation to Journey 6 (`/safety/manage`): `DashboardToolLinks`'s badge (`activeEmergencyCount`) is sourced from the same `useSafetyDashboard()` hook documented in Journey 6, giving the management hub a live-updating signal of this page's Active Emergencies panel without needing to visit it.

## Gaps or inconsistencies found

1. **Confirmed, real gap**: the report-submit response includes a `conversationId` (an incident conversation, mirroring SOS's own auto-created incident-conversation pattern per Journey 1's cross-references), but the page never reads or surfaces it — `res.data?.conversationId` is fetched off the response type but has no corresponding state variable, no "Open conversation" link, nothing. If a real incident conversation is in fact created server-side for every Emergency report (not independently verified this pass), it is currently unreachable from this page's own UI.
2. **The report form has no offline resilience, unlike SOS.** `getGeolocation()` failing or timing out (12s timeout, `enableHighAccuracy: true`) simply fails the submission outright with an inline error — no optimistic local record, no IndexedDB queue, no Background Sync retry comparable to `useSosOfflineQueue`. For a page whose entire purpose is emergency reporting, this is a meaningfully less resilient design than the SOS trigger it sits alongside in the same feature catalog, and worth reconciling in the rebuild — should Emergency reports get the same offline-first treatment SOS already has?
3. **No client-side role/ownership check on any of the four per-emergency actions (escalate/resolve/cancel/acknowledge).** Every action button renders for every viewer of an active-status card, with no `isReporter`-equivalent gate (contrast Journey 2's Incident Reports, which explicitly restricts lifecycle actions to `isReporter`). Whether this is enforced server-side was not verified this pass — if it is not, any signed-in user who can see another user's active emergency (e.g. via the guardian alert routing) could resolve, cancel, or "acknowledge" someone else's emergency report.
4. **Escalate's synthetic `agencyResponse` payload (`success`/`referenceId`/`agencyName`) is fetched from the server but never displayed.** The button's own explicit "not a real dispatch" copy is honest about what escalate does NOT do, but the response shape suggests the backend already simulates something like a dispatch acknowledgment (a reference ID, an agency name) that could be surfaced as a receipt — currently discarded, only triggering a silent history re-fetch.
5. **Resolve and cancel both hardcode their payloads** (`{status:'resolved'}`, `{reason:'Reported by mistake'}`) rather than collecting user input, unlike the Incident Reports journey's (admittedly native-`window.prompt()`-based, itself flagged) free-text resolution. A user resolving an emergency for a genuinely different reason than "mistake" has no way to record what actually happened via this page's cancel action.
6. **Acknowledge on this page is a distinct endpoint from SOS's guardian-acknowledge (`/sos/:id/acknowledge`, Journey 1), with no visible UI distinction between "I am the reporter acknowledging my own report" and "I am a guardian/third party acknowledging someone else's."** Combined with gap #3's missing ownership check, it's unclear from the frontend alone who this action is actually meant for.
7. **Incident Replay's failure state is a bare, non-actionable text row** ("Failed to load timeline.") with no retry button and no differentiation between an access-denied (403 — per the service comment, replay access is restricted to "the victim, their accepted guardians, and admins") response and a generic network/server failure. A guardian who isn't accepted, or a report whose replay data hasn't been generated yet, would see an identical unhelpful message either way.
8. **The client-side type→agency mapping in `EMERGENCY_TYPES` is purely cosmetic and can visibly disagree with the server's real `assignedAgency`.** The form shows "Assigned to (for your records): NPF" (or whichever) based on a static local map before submission, but the success banner then shows whatever `assignedAgency` the server actually returned — these could differ, and nothing in the UI flags or reconciles that possibility; a user could reasonably be confused if the pre-submit hint and the post-submit confirmation name different agencies.
9. **No pagination on Recent Emergencies** — `getRecentEmergencies(10)` is a fixed limit-10 call with no "load more"/infinite-scroll affordance found on this page, unlike `/incident-reports`'s infinite-scroll list (Journey 2) or `/safety/trips/history`'s paginated panel — a user with more than 10 past emergency reports has no way to see older ones from this page.

---

# Summary

Traced all ten safety journeys end-to-end from source (the original four — SOS activation, incident reports, live/kidnapping tracking, panic PIN — remain as previously documented above and are only briefly referenced here). This pass adds: Sentinel AI threat-scanning, whose detection is a passive, identical-for-everyone backend process and whose only user-facing controls (`/safety/sentinel/settings`) filter delivery, not scoring — a scored advisory reaches the user through three simultaneous, only loosely-coordinated surfaces (a toast with a hard-navigation "View" link, `RedZoneBanner` at the top of `/feed`, and the full list on `/safety/sentinel` itself), with a confirmed real gap that socket-only advisories can reappear after a page reload since their dismissal is never persisted server-side; the `/safety/manage` hub, confirmed as a genuine six-tab operational surface (guardians, circle/status, check-ins, alerts, tools, overview) whose hash-deep-link scheme has real write/read asymmetry (`#linkers`/`#history` readable but never written) and which introduces wellness Check-ins as a third, independently-implemented missed-interval escalation ladder alongside SOS and Safe Trips, all three converging on the same eventual silent-SOS mechanism; Fake Call, confirmed as the one truly self-contained, zero-backend safety feature in the cluster, with a genuinely robust dual in-page-timer/native-notification scheduling design but no faster/hidden invocation path comparable to the SOS long-press or Panic PIN's disguised URL; Geofences, where a `triggerSos`-flagged restricted zone is advertised as able to auto-fire a real SOS but the frontend itself contains no crossing-detection logic at all (status is purely server-reported) and never visibly confirms such an auto-trigger actually reached `SosContext`, while also repeating the same "own raw socket connection instead of the shared singleton" inconsistency already flagged for `/safety/trips`; and community-wide emergency awareness, where `/community-emergency` (a resident-posted feed, unrelated to `/safety/emergency`) is surfaced ambiently via a pulsing ring on the same floating SOS button used for personal SOS — visually indistinguishable from a genuinely active personal SOS and, when tapped, routing to `/sos` rather than to the emergency feed itself — while `/map` turns out, on direct source inspection, to be a wholly unrelated people/places discovery map with zero incident, red-zone, or emergency overlay of any kind, despite being the most natural place in the app for one.

Cross-cutting observations across all nine journeys: at least three independent, uncoordinated missed-interval-escalation-to-silent-SOS ladders now exist in the codebase (Safe Trips, Wellness Check-ins, and — per the original four journeys — the Panic PIN's direct trigger converges into the same silent-SOS state without an interval at all), each with separate implementations rather than a shared escalation primitive; the "opens its own raw socket.io-client connection instead of the shared `socketService` singleton" inconsistency, first flagged for `/safety/trips`, now has three confirmed instances (`/safety/trips`, `/safety/geofences`, plus the app-wide `RedZoneAlertsContext`/`GuardianAlertsContext` which correctly do use the shared singleton — worth using as the template); and native browser dialogs (`window.prompt()`, `window.confirm()`) continue to appear at consequential decision points (Incident Report resolution, Check-ins schedule restart) despite the rest of the app being fully custom-styled. Most significant net-new finding for the rebuild to resolve deliberately: there is no map-based or otherwise spatial visualization anywhere in the app for community emergencies, Sentinel red-zone advisories, or incident reports — three separate "where is danger" data sources exist, and none of them render on `/map` or any other map surface.

This pass additionally traces a tenth journey: Legacy Emergency (`/safety/emergency`), confirmed — contrary to a plausible reading of its "Legacy" matrix label — to be a well-linked, multiply-reachable feature rather than an orphaned one, with real navigation call sites from the Sentinel hub's feature grid, the SOS command center's Prepare tab and post-trigger guardian-notification card, the Sentinel management dashboard's tool grid (with a live active-count badge), the Sentinel AI advisory hub, a guardian-facing real-time socket toast (the actual landing target whenever an incoming alert has no linked `sosEventId`), and a chat-sharing flow for past reports. "Logged, not real dispatch" concretely means the report is persisted with a cosmetic client-side agency guess and a real phone number surfaced for the user to call themselves, with escalate/resolve/cancel/acknowledge actions that carry no client-side ownership check and, for escalate, a synthetic `agencyResponse` receipt the UI fetches but never displays. Unlike SOS, the report form has no offline resilience (a failed GPS fix simply fails the submission) and silently discards a `conversationId` the backend returns. The page's standout, cluster-unique feature is Incident Replay: a forensic, single merged timeline of location/chat/system events fetched per-incident, with an explicit clock-drift warning banner and per-entry second-precision drift flagging that a rebuild must preserve verbatim. Real-time dispatch updates correctly use the shared `socketService` singleton rather than repeating the raw-socket inconsistency seen in Trips/Geofences — one of the few places in the cluster that gets this right.

Cross-cutting observations, updated for all ten journeys: the "own raw socket instead of the shared singleton" tally remains at three confirmed instances (Trips, Geofences, plus the correctly-behaving app-wide contexts) since Legacy Emergency uses the shared singleton correctly; the SOS-vs-Emergency data-model split (a full `SosEvent` state machine vs. a lighter dispatch-log `Emergency` document) is now fully traced end-to-end, including the exact guardian-routing branch (`sosEventId` present routes to `/safety/incident/[id]`, absent routes to `/safety/emergency`) that decides which of the two post-incident surfaces a guardian lands on; and the offline-resilience asymmetry between SOS (fully offline-first, IndexedDB-queued, never expires) and Legacy Emergency (no offline handling at all) is a new, concrete inconsistency worth resolving deliberately in the rebuild — the two features sit side-by-side in the same feature catalogs but offer meaningfully different reliability guarantees under bad connectivity, the exact condition an emergency-reporting feature should be most resilient to.
