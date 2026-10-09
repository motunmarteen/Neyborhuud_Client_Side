# API → Feature → Page Matrix — Safety / SOS / Emergency

> Verified directly against source in `pwa/src/app/(app)/{safety,sos,incident-reports,community-emergency,map}/`,
> the services (`safety.service.ts`, `incident.service.ts`, `trip.service.ts`, `geo.service.ts`, `content.service.ts`),
> and the hooks/contexts they call into (`useSos`→`SosContext`, `useSosOfflineQueue`, `useSafetyDashboard`,
> `useKidnappingTracking`, `useLiveTrackingPage`, `useTripMonitor`, `useNeighborhoodEmergency`, `RedZoneAlertsContext`,
> `GuardianAlertsContext`). Cross-referenced against `02-api-registry/safety.md`, `incident-reports.md`, `geo.md`,
> `auth.md`, `content.md` (content.md not fully read this pass — its two routes referenced below are inferred from the
> service file's own path literals, not verified against a content.md line item; flagged accordingly).

## Page directory verification

All expected paths exist. Actual file tree found under `pwa/src/app/(app)/`:
- `safety/page.tsx` (hub), `safety/dashboard/page.tsx` (redirect -> `/safety/manage`), `safety/emergency/page.tsx`,
  `safety/fake-call/page.tsx`, `safety/geofences/page.tsx`, `safety/incident/[id]/PageClient.tsx`,
  `safety/kidnapping-tracking/page.tsx` + `watch/[sessionId]/PageClient.tsx`, `safety/manage/page.tsx`,
  `safety/panic-pin/page.tsx` + `enter/page.tsx` + `practice/page.tsx`, `safety/sentinel/page.tsx` + `settings/`,
  `safety/trips/page.tsx` + `history/page.tsx` + `watch/[userId]/PageClient.tsx`
- `sos/page.tsx`
- `incident-reports/page.tsx`, `incident-reports/[id]/PageClient.tsx`
- `community-emergency/page.tsx`
- `map/page.tsx` + `MapComponent.tsx`

Note: `safety/dashboard` is **not** a distinct page — `SafetyDashboardAliasPage` is a pure `redirect('/safety/manage')`.
`safety/sentinel` (Sentinel AI threat scanning / red-zone alerts) and `safety/page.tsx` (Sentinel hub / feature
discovery) are two genuinely distinct features that happen to share the "Sentinel" name — not a duplicate.

---

## Page: `/safety` (Sentinel hub)
**File(s):** `pwa/src/app/(app)/safety/page.tsx`
**Purpose:** Feature-discovery hub for all safety tools (grid of `SentinelFeatureCard`s by category) plus the always-visible SOS state banner.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/sos/active | GET | `safetyService.getActiveSos()` -> `useSos()` (`SosContext.refresh`) | safety.md: GET /sos/active | Polled on mount/user change, plus socket-driven refresh |
| /safety/sos/:id/cancel | POST | `safetyService.cancelSos()` -> `useSos().cancelSos()` | safety.md: POST /sos/:id/cancel | Via hero "cancel" and countdown overlay |
| /safety/sos/:id/resolve | POST | `safetyService.resolveSos()` -> `useSos().resolveSos()` | safety.md: POST /sos/:id/resolve | Via hero "resolve" |
| /safety/panic-pin/status | GET | `safetyService.getPanicPinStatus()` (inline in page's `PanicPinHint`) | safety.md: GET /panic-pin/status | Only used to conditionally show "Set Panic PIN" hint |

**Components used:** `SentinelHubHero`, `SentinelHubQuickNav`, `SentinelFeatureCard`, `SentinelHubTabBanner`, `SentinelSectionHeader`, `SosCountdownOverlay`, `PanicPinHint` (local), `SosNavHint` (local).
**Observed states:** SOS phase surfaced via hero (`idle`/`pending`/`active` passthrough only — `resolved`/`cancelled` treated as `idle` for this component); tab state (`overview`/category tabs) is pure client UI state, not server-driven.
**Unmatched calls:** none — all calls trace cleanly to safety.md.

---

## Page: `/safety/sentinel` (Sentinel AI / threat scanning)
**File(s):** `pwa/src/app/(app)/safety/sentinel/page.tsx`, `pwa/src/contexts/RedZoneAlertsContext.tsx`
**Purpose:** Displays AI-flagged "red zone" safety advisories for the user's home/work area; static "what Sentinel watches" explainer; links to SOS/Emergency for immediate danger.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /notifications/red-zone-alerts (approx.) | GET | `notificationsService.getRedZoneAlerts(10)` -> `useRedZoneAlerts()` | **Cross-cluster — notifications.md, not verified this pass** | Not a safety.md route; Sentinel red-zone alerts are delivered as Notification documents, not a safety.md endpoint |
| (notification mark-read) | — | `notificationsService.markAsRead()` -> `dismissAlert()` | **Cross-cluster — notifications.md** | Persists dismissal so alert doesn't reappear |
| `safety:red_zone` (socket event) | WS | `socketService` in `RedZoneAlertsContext` | N/A (WebSocket, no REST registry entry) | Live-pushes new alerts with toast |

**Components used:** `SentinelSubpageLayout`, `SentinelFeatureCard`, `SentinelHowItWorks`, `SentinelSectionHeader`, local `RecentRedZoneAlerts`.
**Observed states:** loading skeleton, empty state ("No red-zone alerts"), populated list with severity badges (critical/high/warning -> Critical/High/Advisory labels), dismiss-in-place.
**Unmatched calls:** This entire page's data path (`notificationsService.getRedZoneAlerts`) is **not backed by any route in safety.md** — it belongs to the notifications module. Flagged for the notifications-cluster pass to confirm the exact route path; not fabricated here, just out of this cluster's registry scope.

---

## Page: `/safety/dashboard`
**File(s):** `pwa/src/app/(app)/safety/dashboard/page.tsx`
**Purpose:** Pure `redirect('/safety/manage')` — not a real page, no API calls of its own.

---

## Page: `/safety/manage` (Sentinel Dashboard)
**File(s):** `pwa/src/app/(app)/safety/manage/page.tsx`, `useSafetyDashboard.ts`, `useSos.ts`, `GuardianAlertsContext.tsx`, plus panel components `DashboardGuardiansPanel`, `DashboardCirclePanel`, `DashboardCheckInsPanel`, `DashboardLiveStatusPanel`, `DashboardActiveSosPanel`.
**Purpose:** Tabbed dashboard (Overview / Guardians / Circle / Check-ins / Alerts / Tools) — the operational hub for guardians, safety circle, wellness check-ins, and live status sharing.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/guardians | GET | `safetyService.getGuardians()` -> `useSafetyDashboard()` | safety.md: GET /guardians | Filterable by status |
| /safety/guardians/requests/incoming | GET | `safetyService.getIncomingGuardianRequests()` -> `useSafetyDashboard()` | safety.md: GET /guardians/requests/incoming | |
| /safety/status/guardians-feed | GET | `safetyService.getGuardiansFeed()` -> `useSafetyDashboard()` | safety.md: GET /status/guardians-feed | |
| /safety/emergency/active | GET | `safetyService.getActiveEmergencies()` -> `useSafetyDashboard()` | safety.md: GET /emergency/active | Used only for a count (`activeEmergencyCount`); failure swallowed (`.catch(() => null)`) |
| /safety/guardians/request | POST | `safetyService.requestGuardian()` -> `DashboardGuardiansPanel.onAddGuardian` | safety.md: POST /guardians/request | Uses the "current" (non-legacy) path |
| /safety/guardians/respond | POST | `safetyService.respondGuardian()` -> `DashboardGuardiansPanel.onRespond` | safety.md: POST /guardians/respond | Uses the "current" path |
| /safety/guardians/:guardianId | DELETE | `safetyService.removeGuardian()` -> `DashboardGuardiansPanel.onRemove` | safety.md: DELETE /guardians/:guardianId | |
| /safety/circle/mine | GET | `safetyService.getMyCircle()` -> `DashboardCirclePanel` | safety.md: GET /circle/mine | |
| /safety/circle/incoming | GET | `safetyService.getIncomingCircleInvites()` -> `DashboardCirclePanel` | safety.md: GET /circle/incoming | |
| /safety/circle/belong-to | GET | `safetyService.getCirclesIBelongTo()` -> `DashboardCirclePanel` | safety.md: GET /circle/belong-to | |
| /safety/circle/invites/:inviteId/respond | POST | `safetyService.respondToCircleInvite()` -> `DashboardCirclePanel` | safety.md: POST /circle/invites/:inviteId/respond | |
| /safety/circle/:memberId | DELETE | `safetyService.removeCircleMember()` -> `DashboardCirclePanel` | safety.md: DELETE /circle/:memberId | |
| /safety/circle/invite | POST | `safetyService.inviteToCircle()` -> `DashboardCirclePanel` | safety.md: POST /circle/invite | |
| /safety/checkins/active | GET | `safetyService.getActiveWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: GET /checkins/active | |
| /safety/checkins/start | POST | `safetyService.startWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: POST /checkins/start | |
| /safety/checkins/checkin | POST | `safetyService.submitWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: POST /checkins/checkin | "I'm okay" button |
| /safety/checkins/pause | POST | `safetyService.pauseWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: POST /checkins/pause | |
| /safety/checkins/resume | POST | `safetyService.resumeWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: POST /checkins/resume | |
| /safety/checkins/stop | POST | `safetyService.stopWellnessCheckIn()` -> `DashboardCheckInsPanel` | safety.md: POST /checkins/stop | |
| /safety/status/me | GET | `safetyService.getMyStatus()` -> `DashboardLiveStatusPanel.loadMyStatus` | **UNMATCHED** — no `/status/me` route in safety.md | See "Cross-cluster notes" — page defensively falls back to `getStatus(user.id)` on failure, strongly suggesting this route 404s in production |
| /safety/status/:userId | GET | `safetyService.getStatus(user.id)` -> `DashboardLiveStatusPanel.loadMyStatus` (fallback) | safety.md: GET /status/:userId | Real fallback path when `/status/me` fails |
| /safety/status/update | POST | `safetyService.updateStatus()` -> `DashboardLiveStatusPanel.onUpdateStatus` | safety.md: POST /status/update | |
| /safety/guardian-activity/:sosEventId | GET | `safetyService.getGuardianActivity()` -> `DashboardActiveSosPanel` | safety.md: GET /guardian-activity/:sosEventId | Only fetched while `sos.phase === 'active'` |
| /safety/sos/active, /:id/cancel, /:id/resolve | — | via `useSos()` | safety.md | Same as `/safety` hub |
| /follow/:id/followers, /follow/:id/following | GET | `followService.getFollowers/getFollowing()` -> `DashboardCirclePanel` mutual-follow candidate list | **Cross-cluster — follow.md, not verified this pass** | Used to suggest Safety Circle invite candidates |

**Components used:** `SentinelDashboardHero`, `DashboardHowItWorks`, `DashboardActiveSosPanel`, `DashboardGuardiansPanel`, `GuardianVsCircleExplainer`, `DashboardCirclePanel`, `DashboardLiveStatusPanel`, `DashboardCheckInsPanel`, `DashboardToolLinks`, `SosGuardianIncomingAlerts`, `SosRecentHistory`, `SosCountdownOverlay`.
**Observed states:** `dataStale` flag (distinguishes "still loading" vs "showing stale snapshot after a failed refresh" — deliberate UX choice per code comment); wellness check-in escalation ladder shown inline (`escalationLevel >= 3` -> "silent SOS was sent" messaging); guardian request accept/reject; circle invite accept/reject.
**Unmatched calls:** `GET /safety/status/me` — see note above and Cross-cluster notes.

---

## Page: `/safety/emergency`
**File(s):** `pwa/src/app/(app)/safety/emergency/page.tsx`
**Purpose:** "Legacy Emergency" report form + active/history/stats panels + per-incident forensic replay viewer. Explicitly labeled in-page copy: "automatic agency dispatch isn't connected yet."

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/emergency/report | POST | `safetyService.reportEmergency()` | safety.md: POST /emergency/report (Legacy Emergency section) | |
| /safety/emergency/active | GET | `safetyService.getActiveEmergencies()` | safety.md: GET /emergency/active | |
| /safety/emergency/history | GET | `safetyService.getRecentEmergencies()` | safety.md: GET /emergency/history | |
| /safety/emergency/stats | GET | `safetyService.getEmergencyStats()` | safety.md: GET /emergency/stats | |
| /safety/emergency/:emergencyId/escalate | POST | `safetyService.escalateEmergency()` | safety.md: POST /emergency/:emergencyId/escalate | UI copy is explicit this only "marks as logged," not real dispatch |
| /safety/emergency/:emergencyId/resolve | POST | `safetyService.resolveEmergency()` | safety.md: POST /emergency/:emergencyId/resolve | |
| /safety/emergency/:emergencyId/cancel | POST | `safetyService.cancelEmergency()` | safety.md: POST /emergency/:emergencyId/cancel | "Never mind, that was a mistake" |
| /safety/emergency/:emergencyId/acknowledge | POST | `safetyService.acknowledgeEmergency()` | safety.md: POST /emergency/:emergencyId/acknowledge | |
| /safety/emergency/:emergencyId/replay | GET | `safetyService.getIncidentReplay()` | safety.md: GET /emergency/:emergencyId/replay (Incident Replay section) | Renders unified timeline (location/chat/system events), clock-drift warning |
| `safety:emergency_dispatch_update` (socket) | WS | `socketService` inline in page | N/A | Live dispatch-status patching for active/history/submitted records |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks` (local page markup only, no dedicated named components beyond these — this page is largely inline JSX, not componentized like the Huud-Score-template pages).
**Observed states:** submitting -> success banner (with/without agency contact info) -> dismiss; per-emergency escalating/cancelling/acknowledging button-level loading states (`escalating`/`cancelling`/`acknowledging` id-keyed); replay open/loading/loaded/failed per emergency id.
**Unmatched calls:** none — every call traces to safety.md's "Legacy Emergency" and "Incident Replay" sections.
**Note:** This is the only page in the cluster to actually exercise the full Legacy Emergency CRUD lifecycle and the Incident Replay endpoint.

---

## Page: `/safety/fake-call`
**File(s):** `pwa/src/app/(app)/safety/fake-call/page.tsx`
**Purpose:** Stage a fake incoming call to help exit an uncomfortable situation. **Zero backend calls** — code comment explicitly states "No backend involvement — purely client-side."

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| — | — | — | N/A | Confirmed no API calls anywhere in this file; uses only Web Audio API, `navigator.vibrate`, and local Capacitor notification scheduling (`scheduleLocalNotification`/`cancelLocalNotification`/`onLocalNotificationTapped`) |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks`; no shared safety components — this page is self-contained.
**Observed states:** `setup` -> `waiting` (countdown, cancellable) -> `ringing` -> `in-call`; native-notification fallback path for backgrounded app.

---

## Page: `/safety/geofences`
**File(s):** `pwa/src/app/(app)/safety/geofences/page.tsx`, `components/safety/GeofenceMap.tsx` (lazy-loaded, SSR-disabled)
**Purpose:** CRUD for safe/alert/restricted geofence zones on an interactive map, with live entry/exit/alert socket feed.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/geofences | GET | `safetyService.listGeofences()` | safety.md: GET /geofences | |
| /safety/geofences | POST | `safetyService.createGeofence()` | safety.md: POST /geofences | |
| /safety/geofences/:id | PATCH | `safetyService.updateGeofence()` | safety.md: PATCH /geofences/:id | |
| /safety/geofences/:id | DELETE | `safetyService.deleteGeofence()` | safety.md: DELETE /geofences/:id | |
| `geofence:entry`/`geofence:exit`/`geofence:alert` (socket) | WS | raw `socket.io-client` instance created in-page (not `socketService`) | N/A | Notably this page opens its **own** direct `io()` connection rather than using the shared `socketService` singleton used everywhere else in the cluster — worth flagging as an inconsistency |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks`, `GeofenceMap` (dynamic import), local `GeofenceCard`.
**Observed states:** map-click -> prefilled create form; edit vs create form mode; live alert toast-like list (client-capped at 20, displaying 5); 20-zone soft limit messaging; battery-impact copy tied to zone count.
**Unmatched calls:** none against safety.md. `POST /safety/geofences/check` (the background-ping endpoint) exists in `safetyService.checkGeofenceLocation()` but **is not called from this page or anywhere else found in this cluster** — see Cross-cluster notes.

---

## Page: `/safety/incident/[id]` (Incident Recap)
**File(s):** `pwa/src/app/(app)/safety/incident/[id]/PageClient.tsx`
**Purpose:** Post-incident summary/timeline for a single SOS event (duration, guardian response times, agency dispatch, tracking pings, personal note).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/sos/:id/summary | GET | `safetyService.getSosSummary()` | safety.md: GET /sos/:id/summary | |
| /safety/sos/:id/note | POST | `safetyService.addSosIncidentNote()` | safety.md: POST /sos/:id/note | |

**Components used:** `SentinelSubpageLayout`; local `StatusPill`, `Stat`.
**Observed states:** loading -> error/summary; drill banner when `summary.isDrill`; note draft/saving/saved with disabled-until-dirty save button.
**Unmatched calls:** none.

---

## Page: `/safety/kidnapping-tracking` (Live Tracking)
**File(s):** `pwa/src/app/(app)/safety/kidnapping-tracking/page.tsx`, `useLiveTrackingPage.ts`, `useKidnappingTracking.ts`, `lib/safetyEligibility.ts`
**Purpose:** Tabbed (Live/Start/Trail/Circle) continuous GPS tracking session for high-risk situations — battery-aware pinging, offline queue, guardian real-time view.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/kidnapping/sessions/active | GET | `kidnappingTrackingService.getActiveSession()` -> `useLiveTrackingPage`/`useKidnappingTracking` | safety.md: GET /kidnapping/sessions/active | |
| /safety/kidnapping/sessions/start | POST | `kidnappingTrackingService.startSession()` -> `useKidnappingTracking.startTracking` | safety.md: POST /kidnapping/sessions/start | Gated client-side by `getLiveTrackingBlockers()` (see auth/permission notes below) |
| /safety/kidnapping/sessions/:sessionId/location | POST | `kidnappingTrackingService.logLocation()` -> `useKidnappingTracking.pingLocation` | safety.md: POST /kidnapping/sessions/:sessionId/location | High-frequency, battery-adaptive interval |
| /safety/kidnapping/sessions/:sessionId/location/batch | POST | `kidnappingTrackingService.batchLogLocations()` -> `useKidnappingTracking.flushOfflineQueue` | safety.md: POST /kidnapping/sessions/:sessionId/location/batch | Chunks of 50 |
| /safety/kidnapping/sessions/:sessionId/history | GET | `kidnappingTrackingService.getLocationHistory()` -> `useLiveTrackingPage.loadHistory` | safety.md: GET /kidnapping/sessions/:sessionId/history | |
| /safety/kidnapping/sessions/:sessionId/latest | GET | `kidnappingTrackingService.getLatestLocation()` -> `useLiveTrackingPage.loadHistory` (fallback) | safety.md: GET /kidnapping/sessions/:sessionId/latest | |
| /safety/kidnapping/sessions/:sessionId/summary | GET | `kidnappingTrackingService.getTrackingSummary()` -> `useKidnappingTracking.refreshSummary` | safety.md: GET /kidnapping/sessions/:sessionId/summary | |
| /safety/kidnapping/sessions/:sessionId/stop | POST | `kidnappingTrackingService.stopSession()` -> `useKidnappingTracking.stopTracking` | safety.md: POST /kidnapping/sessions/:sessionId/stop | |
| /safety/kidnapping/triangulate | POST | `kidnappingTrackingService.triangulate()` -> `useKidnappingTracking.pingLocation` (GPS-fail fallback) | safety.md: POST /kidnapping/triangulate | Registry flags this handler as a possible stub — frontend calls it regardless as its only fallback when GPS fails |
| `kidnapping:location_update`/`kidnapping:tracking_started`/`kidnapping:signal_lost` (socket) | WS | `socketService` -> `useLiveTrackingPage` | N/A | |

**Components used:** `LiveTrackingPageHero`, `LiveTrackingActivePanel`, `LiveTrackingDuringSessionTips`, `LiveTrackingStartPanel`, `LiveTrackingTrailPanel`, `LiveTrackingGuardianPanel`, `LiveTrackingHowItWorks`, `LiveTrackingRequirementsCard` (present in dir, not directly traced this pass).
**Observed states:** `pageLoading`; `live` vs not (via `isSessionLive(session)`); tab auto-redirect to "Start" blocked when a session is already live; offline `queuedCount`/`isOnline`; `stopping`/`summaryLoading` sub-states.
**Auth/permission gate (precise):** `getLiveTrackingBlockers(user)` in `lib/safetyEligibility.ts` — code comment states it explicitly **"Mirrors backend `requireVerification` on POST /safety/kidnapping/sessions/start."** Blocks starting a session unless: (1) signed in, (2) email verified (`isUserEmailVerified`), (3) profile has first+last name and a Nigerian phone number (`getSafetyProfileGaps`). Each gap renders a specific actionable message/link (`/verify-email`, `/complete-profile[?focus=phone]`).
**Unmatched calls:** none.

---

## Page: `/safety/kidnapping-tracking/watch/[sessionId]` (Guardian view)
**File(s):** `pwa/src/app/(app)/safety/kidnapping-tracking/watch/[sessionId]/PageClient.tsx`
**Purpose:** Read-only, auto-refreshing (30s poll + socket) guardian view of someone else's live tracking session.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/kidnapping/sessions/:sessionId | GET | `kidnappingTrackingService.getSession()` | safety.md: GET /kidnapping/sessions/:sessionId | 403 explicitly handled -> "You are not an accepted guardian of this user." |
| /safety/kidnapping/sessions/:sessionId/latest | GET | `kidnappingTrackingService.getLatestLocation()` | safety.md: GET /kidnapping/sessions/:sessionId/latest | |
| `kidnapping:location_update`/`kidnapping:signal_lost` (socket) | WS | `socketService` inline | N/A | |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks`; local `GuardianTrackingViewInner`.
**Observed states:** loading, 403 (not-a-guardian) error, 404 (not-found) error, `lost_signal` visual state distinct from `active`/`ended`.
**Auth/permission gate:** server-enforced (owner-or-accepted-guardian) — surfaced client-side only as a caught 403, not pre-checked.
**Unmatched calls:** none.

---

## Page: `/safety/manage` — see above (deduped; also covers `/safety/manage#guardians`, `#status`, `#checkins`, `#alerts` hash-tab deep links).

## Page: `/safety/panic-pin`
**File(s):** `pwa/src/app/(app)/safety/panic-pin/page.tsx`
**Purpose:** Set/rotate/remove the duress PIN.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/panic-pin/status | GET | `safetyService.getPanicPinStatus()` | safety.md: GET /panic-pin/status | |
| /safety/panic-pin | POST | `safetyService.setPanicPin()` | safety.md: POST /panic-pin | Requires `currentPin` when rotating |
| /safety/panic-pin | DELETE | `safetyService.removePanicPin()` | safety.md: DELETE /panic-pin | Requires `currentPin` |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks`.
**Observed states:** `set`/`rotate`/`remove` modes; loading -> idle; busy submit; success/error banners.
**Unmatched calls:** none.

## Page: `/safety/panic-pin/enter`
**File(s):** `pwa/src/app/(app)/safety/panic-pin/enter/page.tsx`
**Purpose:** The real duress-trigger surface, deliberately disguised as a generic PIN gate.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/panic-pin/verify | POST | `safetyService.verifyPanicPin()` | safety.md: POST /panic-pin/verify | On match, **silently** triggers a silent SOS server-side per registry note; UI shows identical "Verified."/"Incorrect PIN." text regardless of outcome by design |

**Components used:** `PanicPinKeypad` (`components/safety/PanicPinKeypad.tsx`, not separately traced).
**Observed states:** single-shot submit -> identical-looking success/failure text (deliberately non-distinguishing, documented extensively in file header comments as the entire security premise of this feature).
**Auth/permission gate:** Security-by-obscurity, not app-level auth — page is intentionally unlinked from any in-app navigation; reachable only via bookmarked URL.
**Unmatched calls:** none.

## Page: `/safety/panic-pin/practice`
**File(s):** `pwa/src/app/(app)/safety/panic-pin/practice/page.tsx`
**Purpose:** Safe rehearsal of the same disguised keypad UI — **never** calls the backend, regardless of input.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| — | — | — | N/A | Explicitly simulated client-side with `Math.random()` outcome and artificial delay; comment states this is intentional so practicing a real PIN here can never accidentally fire a real silent SOS |

**Components used:** `PanicPinKeypad`.
**Observed states:** identical visual states to `/enter` plus a small fixed "Practice mode" banner outside the disguised keypad's own layout.

---

## Page: `/safety/trips` (Safe Trips)
**File(s):** `pwa/src/app/(app)/safety/trips/page.tsx`, `useTripMonitor.ts`
**Purpose:** Tabbed (Trip/Start/History/Circle) trip-monitoring UI — plan/start/activate a trip, background GPS pinging, check-ins, pause/resume, escalation banners, auto-SOS banner.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/trips/active | GET | `tripService.getActiveTrip()` -> `useTripMonitor.refreshTrip` | safety.md: GET /trips/active | |
| /safety/trips/start | POST | `tripService.startTrip()` -> `useTripMonitor.startTrip` | safety.md: POST /trips/start | "Create + activate in one call — most common path" per registry; matches usage |
| /safety/trips/create | POST | `tripService.createTrip()` -> `useTripMonitor.planTrip` | safety.md: POST /trips/create | Deliberately does not start GPS tracking (comment confirms this matches backend's planned-vs-active distinction) |
| /safety/trips/:id/activate | POST | `tripService.activateTrip()` -> `useTripMonitor.activatePlannedTrip` | safety.md: POST /trips/:id/activate | |
| /safety/trips/:id/checkin | POST | `tripService.checkIn()` -> `useTripMonitor.checkIn` | safety.md: POST /trips/:id/checkin | Offline-queued via `useOfflineQueue` if no connection |
| /safety/trips/:id/location | POST | `tripService.updateLocation()` -> `useTripMonitor.startTracking.pingLocation` | safety.md: POST /trips/:id/location | Dual mechanism: `watchPosition` + 30s interval fallback; also on `visibilitychange` |
| /safety/trips/:id/complete | POST | `tripService.completeTrip()` -> `useTripMonitor.completeTrip` | safety.md: POST /trips/:id/complete | |
| /safety/trips/:id/cancel | POST | `tripService.cancelTrip()` -> `useTripMonitor.cancelTrip` | safety.md: POST /trips/:id/cancel | |
| /safety/trips/:id/pause | POST | `tripService.pauseTrip()` -> `useTripMonitor.pauseTrip` | safety.md: POST /trips/:id/pause | |
| /safety/trips/:id/resume | POST | `tripService.resumeTrip()` -> `useTripMonitor.resumeTrip` | safety.md: POST /trips/:id/resume | |
| `trip:started`/`trip:escalation`/`trip:missed_checkin`/`trip:completed`/`trip:route_deviation`/`trip:sos_triggered`/`trip:update` (socket) | WS | raw `socket.io-client` `io()` instance in `useTripMonitor` (own connection, not `socketService`) | N/A | Same pattern as `/safety/geofences` — a second page/hook that opens its own direct socket rather than using the shared singleton |

**Components used:** `TripsPageHero`, `TripsActivePanel`, `TripsAutoSosBanner`, `TripsEscalationBanner`, `TripsFloatingSosButton`, `TripsGuardianPanel`, `TripsHistoryPanel`, `TripsHowItWorks`, `TripsStartForm`.
**Observed states:** `loading`/`tracking`/`checkInCountdown`; `escalationAlert` (level + message); `autoSosTriggered`/`autoSosEventId` (server auto-escalated to a real SOS from missed check-ins — distinct visual banner, manual SOS button always still reachable per code comment "must never be gated behind trip conditions"); floating SOS button only rendered when trip is live and unpaused.
**Unmatched calls:** none against safety.md.

## Page: `/safety/trips/history`
**File(s):** `pwa/src/app/(app)/safety/trips/history/page.tsx`, `components/sentinel/trips/TripsHistoryPanel.tsx`
**Purpose:** Full paginated trip history (same panel as the Trips page's History tab, standalone route).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/trips | GET | `tripService.listTrips()` -> `TripsHistoryPanel` | safety.md: GET /trips | Paginated |

**Components used:** `TripsHistoryPanel` (shared with `/safety/trips`'s History tab).
**Observed states:** loading skeletons, empty state, expand/collapse per-trip card, pagination.

## Page: `/safety/trips/watch/[userId]` (Guardian trip view)
**File(s):** `pwa/src/app/(app)/safety/trips/watch/[userId]/PageClient.tsx`
**Purpose:** Read-only, 60s-auto-refreshing guardian view of a protege's active trip.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/trips/guardian-view/:userId | GET | `tripService.getTripGuardianView()` | safety.md: GET /trips/guardian-view/:userId | 403 explicitly handled -> "You are not an accepted guardian of this user." |

**Components used:** `SentinelSubpageLayout`, `SentinelHowItWorks`; local `GuardianTripViewInner`.
**Observed states:** loading, 403 error, "no active trip" success-empty state, active-trip stats grid, prominent auto-SOS banner when `trip.linkedSosEventId` is set, escalation-level color coding.
**Unmatched calls:** none.

---

## Page: `/sos` (SOS command center)
**File(s):** `pwa/src/app/(app)/sos/page.tsx`, `contexts/SosContext.tsx`, `hooks/useSosOfflineQueue.ts`, and the `components/sentinel/sos/*` family.
**Purpose:** Tabbed (Now/Prepare/History/Circle) primary SOS surface — trigger, drill, guardians-notified card, history, circle feed, panic-PIN nudge.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /safety/sos/trigger | POST | `safetyService.triggerSos()` -> `SosContext.triggerSos()` (via `useSos()`) | safety.md: POST /sos/trigger | Real SOS trigger; explicitly **not** gated by `requireVerification` server-side per registry note, matched by the total absence of any client-side verification gate on this action (unlike kidnapping-tracking's `getLiveTrackingBlockers`) |
| /safety/sos/trigger (offline retry) | POST | `safetyService.triggerSos()` -> `useSosOfflineQueue.flush()` | safety.md: POST /sos/trigger | Same endpoint, retried from IndexedDB queue + Background Sync; carries `clientId` idempotency key |
| /safety/sos/:id/cancel | POST | `safetyService.cancelSos()` -> `SosContext.cancelSos()` | safety.md: POST /sos/:id/cancel | |
| /safety/sos/:id/resolve | POST | `safetyService.resolveSos()` -> `SosContext.resolveSos()` | safety.md: POST /sos/:id/resolve | |
| /safety/sos/active | GET | `safetyService.getActiveSos()` -> `SosContext.refresh()` | safety.md: GET /sos/active | |
| /safety/sos/drill | POST | `safetyService.triggerSosDrill()` -> `useSosGuardianDrill()` (Prepare tab, real guardian drill) | safety.md: POST /sos/drill | Real, server-reaching but never creates Emergency/dispatch, per registry note |
| /safety/status/guardians-feed | GET | `safetyService.getGuardiansFeed()` -> `SosGuardiansFeed` (Now tab) | safety.md: GET /status/guardians-feed | |
| /safety/sos/history | GET | `safetyService.getSosHistory(8, 1)` -> `SosRecentHistory` (History tab) | safety.md: GET /sos/history | |
| /safety/emergency/active | GET | `safetyService.getActiveEmergencies()` -> `GuardianAlertsContext.refresh()` (Circle tab, via `SosGuardianIncomingAlerts`) | safety.md: GET /emergency/active | |
| /safety/sos/:id/acknowledge | POST | `safetyService.acknowledgeSos()` -> `GuardianAlertsContext.acknowledge()` (Circle tab "I'm responding") | safety.md: POST /sos/:id/acknowledge | |
| `safety:sos_pending`/`safety:sos_activated`/`safety:sos_cancelled_pending`/`safety:sos_alert`/`safety:emergency_services_dispatched`/`safety:emergency_contact_needed` (socket) | WS | `socketService` in `SosContext` | N/A | Drives the whole pending->active state machine reactively |
| `location_heartbeat` (socket emit) | WS | `socketService.emit()` in `SosContext`'s live-location effect | N/A | Only while `phase === 'active'`; `watchPosition`-driven, throttled to 1 emit/5s client-side |
| `safety:emergency_alert`/`safety:sos_activated` (socket) | WS | `socketService` in `GuardianAlertsContext` | N/A | |

**Components used:** `SosCountdownOverlay`, `SosGuardianIncomingAlerts`, `SosGuardiansFeed`, `SosGuardiansNotifiedCard`, `SosHowItWorks`, `SosLongPressTip`, `SosPageHero`, `SosPanicPinBanner`, `SosQuickActions`, `SosRecentHistory`, `SosTriggerCard`, `SentinelSectionHeader`, `SentinelBackLink`.
**Observed states (rich state machine — this is the core safety feature):**
- `SosPhase` (from `SosContext`): `idle` -> `pending` (countdown running, cancellable, `pendingUntil`-driven ticking timer) -> `active` (live, heartbeat running) -> `resolved`/`cancelled` (both auto-clear back to `idle` after 1.5s, giving the UI a moment to show the terminal state before resetting).
- `offlineQueueStatus` (from `useSosOfflineQueue`): `idle` -> `queued` -> `sending` -> `sent`/`failed`. On a trigger that gets no HTTP response at all (network/no-signal), the context **optimistically sets a local `activeSos` with `_id: clientId`** and queues for retry — a genuinely important detail: the UI shows "triggered" state even before the server has ever seen the request.
- `emergencyContactNeeded`: non-auto-clearing state — set when guardian escalation has no automated dispatch path, giving the user real numbers to call themselves; persists until user dismisses (by design, "last line of defense").
- `notifyMeta` (`guardiansTotal`/`emergencyId`/`sosEventId`) surfaced distinctly from `activeSos` itself.
- Drill mode (`useSosDrill`, Prepare tab) is **purely local**, no backend call at all — distinct from `useSosGuardianDrill` which does reach the server.
**Auth/permission gate:** None client-side on `triggerSos` — matches the registry's explicit backend note that SOS trigger is deliberately **not** gated by `requireVerification` ("an emergency action must not be blocked by an incomplete profile").
**Unmatched calls:** none against safety.md.

---

## Page: `/incident-reports`
**File(s):** `pwa/src/app/(app)/incident-reports/page.tsx`
**Purpose:** Community incident reporting feed — file/browse/filter/search reports, witness/confirm/dispute interactions. Explicitly distinct from SOS/Emergency (civic record vs. live response) per registry commentary, and the page code reflects that separation cleanly (no cross-calls into `safety.service.ts`).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /incident-reports | POST | `incidentService.create()` | incident-reports.md: POST / | Gated server-side by `requireVerified` ("false reports cause panic") — **no client-side pre-check or explanatory UI** for unverified users found on this page; the registry's own recommendation ("composer should clearly explain why they need to verify first") does not appear to be implemented — flagged as a gap |
| /incident-reports | GET | `incidentService.list()` | incident-reports.md: GET / | Filterable (category/severity/status/search), infinite-scroll via `IntersectionObserver` |
| /incident-reports/:id/interact/:type | POST | `incidentService.interact()` | incident-reports.md: POST /:id/interact/:type | witness/confirm/dispute, optimistic count update |

**Components used:** local `CreateIncidentForm`, `IncidentCard`; shared `AppBrowseLayout`, `BrowseEmptyState`, `LocalHuudHubHeader`, `LocalHuudHubPrimaryAction`.
**Observed states:** create-form toggle, infinite-scroll loading/loadingMore, per-category/status/search filter chips, optimistic witness/confirm/dispute toggle.
**Unmatched calls:** none.

## Page: `/incident-reports/[id]`
**File(s):** `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`, `page.tsx`
**Purpose:** Full incident detail — description, location, tags, interactions, reporter lifecycle actions (update/escalate/resolve), comments.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /incident-reports/:id | GET | `incidentService.getById()` | incident-reports.md: GET /:id | |
| /incident-reports/:id/comments | GET | `incidentService.listComments()` | incident-reports.md: GET /:id/comments | |
| /incident-reports/:id/interact/:type | POST | `incidentService.interact()` | incident-reports.md: POST /:id/interact/:type | |
| /incident-reports/:id/comments | POST | `incidentService.addComment()` | incident-reports.md: POST /:id/comments | |
| /incident-reports/comments/:commentId | DELETE | `incidentService.deleteComment()` | incident-reports.md: DELETE /comments/:commentId | |
| /incident-reports/:id/updates | POST | `incidentService.addUpdate()` | incident-reports.md: POST /:id/updates | Reporter-only UI gate (`isReporter`) |
| /incident-reports/:id/resolve | POST | `incidentService.resolve()` | incident-reports.md: POST /:id/resolve | Reporter-only UI gate; uses `window.prompt()` for resolution text (not a proper form) |
| /incident-reports/:id/escalate | POST | `incidentService.escalate(id, 'community_admin')` | incident-reports.md: POST /:id/escalate | **Notable bug/gap:** `escalatedTo` is hardcoded to the literal string `'community_admin'` — there is no UI to actually choose an escalation target despite the service function accepting an arbitrary `escalatedTo` param |

**Components used:** local `CommentItem`, `UpdateItem`; shared `LocalHuudSubpageShell`.
**Observed states:** loading spinner, error+back-button, reporter-only action row (Add Update/Escalate/Resolve, shown only for `open`/`in_progress` status), inline update-form toggle, comment submit spinner.
**Unmatched calls:** `PATCH /incident-reports/:id/status` (`incidentService.changeStatus()`) and `PATCH /incident-reports/:id` (`incidentService.update()`) are both **defined in the service but never called from this page or the list page** — see Cross-cluster notes.

---

## Page: `/community-emergency`
**File(s):** `pwa/src/app/(app)/community-emergency/page.tsx`
**Purpose:** Resident-posted community emergency alerts (crime/danger/missing person/fire/accident/suspicious activity) with reactions ("I'm Aware"/"Nearby"/"I'm Safe"). File header explicitly states this is **distinct from `/safety/emergency`** (SOS dispatch) — this is a community feed post, not an emergency-response record. Uses `content.service.ts`, not `safety.service.ts`/`incident.service.ts` at all.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /content/emergency | POST | `contentService.createEmergencyPost()` | **Cross-cluster — content.md, not fully read this pass.** Path confirmed via service-file comment `POST /api/v1/content/emergency` and matching `apiClient.post("/content/emergency", ...)` call — high confidence this is real, but not line-verified against content.md itself | Rate-limited per in-page copy ("up to 3 per hour") — limit not independently verified against backend source this pass |
| /feed?contentType=emergency | GET | `contentService.getEmergencyFeed()` | **Cross-cluster — content.md/feed module, not verified this pass.** Comment confirms `GET /api/v1/feed?contentType=emergency` | Also reused by `useNeighborhoodEmergency()` (BottomNav SOS-ring indicator) with `limit: 5` |
| /content/posts/:postId/aware | POST | `contentService.toggleImAware()` | **Cross-cluster — content.md, not verified this pass** | |
| /content/posts/:postId/nearby | POST | `contentService.toggleImNearby()` | **Cross-cluster — content.md, not verified this pass** | |
| /content/posts/:postId/safe | POST | `contentService.toggleSafeMark()` | **Cross-cluster — content.md, not verified this pass** | |

**Components used:** local `CreateEmergencyForm`, `EmergencyCard`; shared `AppBrowseLayout`, `BrowseEmptyState`, `LocalHuudHubHeader`.
**Observed states:** create-form toggle, sign-in prompt for anonymous users, expiry countdown per post (`getExpiryCountdown`, auto-"Expired" styling), infinite scroll, optimistic reaction counters.
**Unmatched calls:** All calls on this page trace to the `content` module (not `safety.md` or `incident-reports.md`), so **none of this page's API surface is documented in this cluster's registry files** — every route above needs confirmation in a future `content.md` read-through. Flagged, not assumed.

---

## Page: `/map`
**File(s):** `pwa/src/app/(app)/map/page.tsx`, `pwa/src/app/(app)/map/MapComponent.tsx`
**Purpose:** Leaflet-based discovery map — nearby users (People layer) and LGA aggregates (Places layer); publishes the viewer's own live GPS so others can see them.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /auth/location/update | PUT | `geoService.updateCurrentLocation()` | **auth.md** (not geo.md): PUT /location/update | Cross-cluster match confirmed by reading auth.md directly — route is real, just lives in a different registry file than expected |
| /geo/nearby/users | GET | `geoService.getNearbyUsers()` | geo.md: GET /nearby/users | |
| /geo/places | GET | `geoService.getPlaces()` | geo.md: GET /places | |
| /geo/places/:lga/stats | GET | `geoService.getPlaceStats()` | geo.md: GET /places/:lga/stats | |
| /follow/:id (follow/unfollow) | POST/DELETE | `followService.followUser()`/`unfollowUser()` | **Cross-cluster — follow.md, not verified this pass** | Triggered from map marker selection sheet |
| /content/locations/follow | POST | raw `apiClient.post('/content/locations/follow', ...)` | **UNMATCHED against geo.md; likely content.md, not verified this pass** | "Follow this LGA/Place" action — called directly via `apiClient`, bypassing any service wrapper entirely (no `geoService`/`contentService` method for it) |
| /content/locations/follow/:lga | DELETE | raw `apiClient.delete(...)` | **UNMATCHED against geo.md; likely content.md, not verified this pass** | Same pattern — direct `apiClient` call, no service wrapper |

**Components used:** `MapSelectionSheet`, `BottomNav`.
**Observed states:** `locationStatus`: `prompt` -> `loading` -> `success`/`error` (falls back to Lagos centroid on GPS denial/failure); `layer`: `people`/`places` toggle; `selectedItem` sheet (user or place); GPS publish throttled to 1 per 90s (`MAP_PUBLISH_MIN_MS`) except the first publish which fires immediately.
**Unmatched calls:** `geoService` also exports `getStates()`, `getLGAs()`, `getWards()`, `getNearbyPosts()`, `getNearbyEvents()`, `verifyAssignedCommunityLocation()` — **none of these geo.service.ts methods are called from MapComponent** (or anywhere else found in this cluster), and none of `/geo/states`, `/geo/states/:state/lgas`, `/geo/states/:state/lgas/:lga/wards`, `/geo/nearby/posts`, `/geo/nearby/events` appear in geo.md's registry at all — these look like dead/legacy service methods calling routes that may no longer exist server-side. Flagged for the geo/onboarding cluster to confirm, not fixed here.

---

## Cross-cluster notes

**Registry routes in safety.md with no caller found anywhere in this cluster:**
- `POST /safety/sos` (legacy alias of `/sos/trigger`) — only `/sos/trigger` is called; the legacy alias appears genuinely unused by the frontend.
- `POST /safety/guardians` and `POST /safety/guardians/accept` (legacy aliases) — only the "current" `/guardians/request` and `/guardians/respond` paths are called.
- `GET /safety/guardians/eligible-linkers` — **not called directly.** `useSafetyDashboard.loadLinkers()` instead calls `fetchEligibleGuardianCandidates()` (`lib/guardianEligibleFollowers.ts`, not read this pass) — that helper may or may not hit this route internally; not confirmed either way, flagged for follow-up rather than assumed unused.
- `POST /safety/geofences/check` (`safetyService.checkGeofenceLocation()`) — exists in the service, described as "Background GPS ping from the PWA service worker," but no caller found in any page/hook in this cluster. Plausibly called from service-worker code outside `src/app`/`src/hooks`/`src/services` page-level scope — not confirmed, flagged rather than assumed dead.
- `PATCH /safety/trips/:id` and `POST /safety/trips/:id/end` (both marked "Legacy" in registry) — not called; `useTripMonitor`/`tripService` use the non-legacy complete/cancel/pause/resume set exclusively.
- `POST /safety/trips/check-escalations` (admin-only, `requireAdmin`) — correctly not called from any user-facing page in this cluster; this is an admin/ops route, out of scope here by design.
- `GET /safety/admin/metrics`, `GET /safety/admin/ops-status` — admin-only, correctly absent from this cluster.
- `GET /safety/kidnapping/sessions/guardian-active` (`kidnappingTrackingService.getActiveSessionsForGuardian()`) — method exists in the service but **no page calls it**; guardians instead reach individual sessions via the direct `/safety/kidnapping-tracking/watch/[sessionId]` URL (presumably shared via a notification/alert link), so there appears to be no in-app screen listing *all* currently-watchable sessions for a guardian. Worth flagging as a possible missing feature/page.
- `GET /safety/status/:userId` for arbitrary other users — only ever called with the current user's own id (as the `getMyStatus()` fallback); no page fetches a specific other user's status by id directly (status is only ever seen via the aggregate guardians-feed).

**Real bugs / inconsistencies found (not fixed, just flagged):**
1. `safetyService.getMyStatus()` calls `GET /safety/status/me`, which **does not exist** in safety.md's registry (only `GET /status/:userId` is documented). `DashboardLiveStatusPanel.loadMyStatus()` wraps this in a try/catch that silently falls back to `getStatus(user.id)` — i.e. the frontend appears to already know `/status/me` fails and papers over it. This should be corrected to call `/status/:userId` directly rather than eating an expected failure on every dashboard load.
2. `/safety/geofences` opens its **own** direct `socket.io-client` connection (`io(getSocketBaseUrl(), ...)`) instead of using the shared `socketService` singleton that every other real-time safety page uses. `useTripMonitor` (`/safety/trips`) does the same thing independently. Both work, but this means the app can end up with 2-3 separate socket connections open simultaneously instead of one, and neither goes through the same `authenticate()` handshake pattern (`/safety/geofences` auths via `auth: { userId }` at connect time; `useTripMonitor` auths via a post-connect `emit('authenticate', token)`; the shared `socketService` used everywhere else has its own pattern again). Worth unifying in the rebuild.
3. `/incident-reports/[id]` hardcodes `escalatedTo: 'community_admin'` in its escalate call with no UI to pick a real target, despite the service function supporting an arbitrary string.
4. `incidentService.changeStatus()` (`PATCH /incident-reports/:id/status`) and `incidentService.update()` (`PATCH /incident-reports/:id`) are both defined and registry-documented but have **no caller** anywhere in the incident-reports pages found — the only status transitions exposed in the UI go through `resolve`/`escalate`, not the generic status-change endpoint.
5. `geo.service.ts` exports several methods (`getStates`, `getLGAs`, `getWards`, `getNearbyPosts`, `getNearbyEvents`) whose routes (`/geo/states`, `/geo/states/:state/lgas`, `.../wards`, `/geo/nearby/posts`, `/geo/nearby/events`) **do not appear anywhere in geo.md's 19-route registry** and have no caller in this cluster either. Either dead code, or routes that exist server-side but weren't captured in geo.md — cannot tell from this pass, flagged for the geo-registry owner to double check.
6. `incident-reports.md`'s own recommendation — that the create-incident UI should clearly explain the `requireVerified` gate to unverified users rather than fail generically — does **not** appear to be implemented on `/incident-reports`; there's no visible pre-check or explanatory copy in `CreateIncidentForm`, it would just fail server-side with whatever generic error `incidentService.create()` throws.
7. `/map` has two raw, un-wrapped `apiClient.post('/content/locations/follow', ...)` / `apiClient.delete(...)` calls that bypass every service-layer pattern used elsewhere (no `geoService`/`contentService` method exists for "follow this LGA"). Functionally fine, but architecturally inconsistent with the rest of the codebase's service-layer discipline.

**Notable design strengths worth preserving in the rebuild:**
- The Panic PIN feature (`/safety/panic-pin`, `/enter`, `/practice`) has unusually careful security-by-obscurity engineering, documented extensively in source comments: identical success/failure UI text, a genuinely separate practice route that can never reach the real endpoint even if the user's real PIN is typed into it, and explicit warnings against ever adding safety-related keywords/iconography to the real entry screen.
- `SosContext`'s offline-first design (optimistic local `activeSos` keyed by `clientId` when the trigger can't reach the server at all, IndexedDB + Background Sync retry) is a genuinely robust pattern for a panic button that must not fail silently on bad signal.
- `getLiveTrackingBlockers()` is a rare example of the frontend explicitly mirroring a specific backend auth gate (`requireVerification` on kidnapping-tracking start) with a code comment naming the exact backend behavior it mirrors — worth using as the template for how other high-risk-feature gates should be documented.
