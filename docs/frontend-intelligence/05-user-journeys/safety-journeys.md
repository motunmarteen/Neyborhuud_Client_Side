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

# Summary

Traced all four safety journeys end-to-end from source. Key corrections to prior steps: kidnapping-tracking and Safe Trips are confirmed fully separate systems (different services/sockets/queues) that only converge via trip-escalation auto-triggering a real SOS; Step 4's "no guardian session-listing screen" gap is actually implemented (Circle tab → `ActiveSessionsList`); and the API registry's `/:id/interact/:type` is a backend path, not a frontend route. New findings: guardian trip-watch has no socket (60s poll only) while kidnapping-tracking guardian-watch does — a real real-time asymmetry between two equally safety-critical screens; the long-press silent SOS gives zero offline-queue feedback; `TripsFloatingSosButton` and the panic-PIN real trigger both lack a direct client-side confirmation that a real SOS fired, which for the panic-PIN path in particular is unverified and worth confirming against backend socket-scoping before shipping the rebuild.
