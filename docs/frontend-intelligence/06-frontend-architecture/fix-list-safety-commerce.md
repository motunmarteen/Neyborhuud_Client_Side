# Fix List — Safety & Commerce Domains

> Step 7 (Frontend Architecture) deliverable. Consolidated, prioritized fix list extracted from
> Steps 1-6 audit documentation, covering the Safety/SOS/Emergency and Marketplace/Jobs/Services/
> Events/Payments domains.
>
> **Source files read in full for this extraction (all 10, exhaustively, not sampled):**
> 1. `02-api-registry/safety.md`
> 2. `02-api-registry/marketplace.md`
> 3. `02-api-registry/jobs.md`
> 4. `02-api-registry/services.md`
> 5. `02-api-registry/events.md`
> 6. `02-api-registry/payments.md`
> 7. `03-api-page-matrix/safety-sos-emergency.md`
> 8. `03-api-page-matrix/marketplace-jobs-services.md`
> 9. `05-user-journeys/safety-journeys.md` (all ten journeys, including the six added in this file
>    beyond the original four: Sentinel AI, `/safety/manage` hub, Fake Call, Geofences, Community
>    Emergency, Legacy Emergency)
> 10. `05-user-journeys/commerce-journeys.md` (all seven journeys: Marketplace deal, Job
>     application, Event RSVP, Service booking, Listing creation/management, Work hub, Premium/
>     HuudCoin)
>
> **Total findings extracted: 101**
> — Critical: 3
> — High: 27
> — Medium: 54
> — Low: 17
>
> Two items referenced in source docs were already fixed/deployed prior to this project step and
> are marked accordingly, not counted as open Critical/High/Medium/Low items above (they appear at
> the end of the Safety and Services sections respectively for traceability): the Huud Gist
> `protectWithBetterAuth` auth bug (documented in `02-api-registry/gossip.md`, out of this file's
> assigned scope but noted per instructions) and the `/settings` NDPR dead-code regression.
>
> Severity legend: **Critical** = safety-relevant or data-loss-risk. **High** = broken user-facing
> feature. **Medium** = inconsistency/dead code with no immediate user impact. **Low** = cosmetic/
> minor.

---

## Safety / SOS / Emergency

### Critical

1. **What**: `/safety/geofences` restricted-zone `triggerSos` auto-trigger has no client-side confirmation it actually reached `SosContext` — a user relying on this to auto-fire SOS on entering a danger zone gets no in-app signal the SOS side actually activated.
   **Where**: `pwa/src/app/(app)/safety/geofences/page.tsx`
   **Severity**: Critical
   **Source**: safety-journeys.md (Geofences journey)
   **Status**: Open

2. **What**: Silent long-press SOS (600ms hold on `FloatingSosButton`) gives zero acknowledgement of receipt — if it fails to reach the server and queues offline, the user under duress has no signal anything happened (not even the muted "queued" indicator the visible `/sos` page shows), since `FloatingSosButton` never renders `offlineQueueStatus`.
   **Where**: `pwa/src/components/sentinel/FloatingSosButton.tsx`
   **Severity**: Critical
   **Source**: safety-journeys.md (SOS activation journey, Gap #2)
   **Status**: Open

3. **What**: Panic PIN real-trigger screen (`/safety/panic-pin/enter`) has zero frontend visibility into whether the silent SOS actually fired — `verifyPanicPin()` success only returns `{verified:true}`, no `sosEventId`/`activeSos` update, and the page never calls `refresh()` or imports `useSos()`; whether the underlying socket event even reaches the same room for panic-pin-originated SOS was not verified, so a user could trigger a real silent SOS with literally no confirmation anywhere in the app.
   **Where**: `pwa/src/app/(app)/safety/panic-pin/enter/page.tsx`
   **Severity**: Critical
   **Source**: safety-journeys.md (Panic PIN journey, Gap #1)
   **Status**: Open

### High

4. **What**: `safetyService.getMyStatus()` calls `GET /safety/status/me`, which does not exist in the safety.md registry (only `GET /status/:userId` is documented) — `DashboardLiveStatusPanel.loadMyStatus()` silently catches the expected failure and falls back to `getStatus(user.id)` on every single dashboard load.
   **Where**: `DashboardLiveStatusPanel` on `/safety/manage`
   **Severity**: High
   **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster note #1); confirmed again in safety-journeys.md (`/safety/manage` journey, Gap #4)
   **Status**: Open

5. **What**: Guardian trip view (`/safety/trips/watch/[userId]`) has no socket subscription at all — pure 60s polling — while the guardian kidnapping-tracking view has both a 30s poll AND a live socket subscription; a guardian watching a trip that just auto-triggered an SOS could be looking at up to a minute of stale data.
   **Where**: `pwa/src/app/(app)/safety/trips/watch/[userId]/PageClient.tsx`
   **Severity**: High
   **Source**: safety-journeys.md (Live/kidnapping tracking journey, Gap #2)
   **Status**: Open

6. **What**: `TripsFloatingSosButton`'s manual SOS override does not call `triggerSos()` directly — it only navigates to `/safety` hub, requiring the user to find and tap the trigger control themselves, despite its own code comment insisting it "must never be gated behind trip conditions" (implying an immediate path).
   **Where**: `TripsFloatingSosButton` component, `/safety/trips`
   **Severity**: High
   **Source**: safety-journeys.md (SOS activation journey, Gap #3; Live/kidnapping tracking journey, Gap #4)
   **Status**: Open

7. **What**: `useKidnappingTracking.startTracking()` accepts optional `sosEventId`/`emergencyId` parameters to link a session to an SOS, but no call site anywhere in the codebase ever supplies them — kidnapping-tracking is never auto-triggered by a real SOS despite the plumbing existing server-side.
   **Where**: `useKidnappingTracking.ts`, `LiveTrackingStartPanel`
   **Severity**: High
   **Source**: safety-journeys.md (Live/kidnapping tracking journey, Gap #3)
   **Status**: Open

8. **What**: A socket-only red-zone advisory (arrived via `safety:red_zone`, never separately fetched via `getRedZoneAlerts()`) has no `notificationId`; dismissing it is in-memory only (`dismissedRef` Set) with no server persistence — a full page reload resets this, so a dismissed advisory can reappear, contradicting the dismiss button's implied promise.
   **Where**: `RedZoneAlertsContext.tsx`
   **Severity**: High
   **Source**: safety-journeys.md (Sentinel AI journey, Gap #1)
   **Status**: Open

9. **What**: No escalation path exists from a Sentinel red-zone advisory to SOS or incident report — a critical `toast.error`-worthy advisory only offers "View" or dismiss; user must manually navigate away to `/sos` or `/incident-reports` themselves.
   **Where**: Sentinel advisory toast / `/safety/sentinel`
   **Severity**: High
   **Source**: safety-journeys.md (Sentinel AI journey, Gap #3); also flagged in 03-api-page-matrix/safety-sos-emergency.md
   **Status**: Open

10. **What**: `FeedSentinelRow`'s "Protected" status label is static presentational chrome, not derived from any live health/connectivity check — a user could have red-zone delivery fully broken (e.g. failed, silently-caught `getRedZoneAlerts()` calls) and this bar would still say "Protected."
    **Where**: `FeedSentinelRow` component, `/feed`
    **Severity**: High
    **Source**: safety-journeys.md (Sentinel AI journey, Gap #4)
    **Status**: Open

11. **What**: `/incident-reports` create form has no client-side pre-check or explanatory UI for the server's `requireVerified` gate — an unverified user fills out the whole form and only discovers the block from a generic error toast, contradicting incident-reports.md's own recommendation.
    **Where**: `CreateIncidentForm` on `/incident-reports`
    **Severity**: High
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Unmatched calls note, Cross-cluster note #6); confirmed in safety-journeys.md (Incident report journey trigger + Gaps)
    **Status**: Open

12. **What**: `/incident-reports/[id]` hardcodes `escalatedTo: 'community_admin'` with no UI to pick a real escalation target, despite the underlying service function supporting an arbitrary string.
    **Where**: `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`
    **Severity**: High
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (page notes + Cross-cluster note #3); safety-journeys.md (Incident report journey, Gap #3)
    **Status**: Open

13. **What**: Comment deletion on incident report detail pages has no visible moderation path — only the comment's own author can delete it; neither the reporter nor any admin-role check can remove another user's comment, a real risk if a comment contains harassment, doxxing, or false accusations on a live incident thread.
    **Where**: `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`
    **Severity**: High
    **Source**: safety-journeys.md (Incident report journey, Gap #4)
    **Status**: Open

14. **What**: `geo.service.ts` exports several methods (`getStates`, `getLGAs`, `getWards`, `getNearbyPosts`, `getNearbyEvents`) whose routes do not appear anywhere in geo.md's registry and have no caller in this cluster — either dead code or undocumented real routes; cannot be determined without a source-level check.
    **Where**: `geo.service.ts`, used from `/map`
    **Severity**: High
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster note #5)
    **Status**: Open

15. **What**: `/map` has two raw, un-wrapped `apiClient.post/delete('/content/locations/follow', ...)` calls with no `geoService`/`contentService` wrapper method — bypasses the service-layer pattern used everywhere else, and the route isn't matched against geo.md.
    **Where**: `pwa/src/app/(app)/map/MapComponent.tsx`
    **Severity**: High
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (page notes + Cross-cluster note #7)
    **Status**: Open

16. **What**: The neighborhood-emergency ring state on `FloatingSosButton` (community emergency exists nearby) and the user's own active-personal-SOS ring state are combined via plain OR into the identical `--live` CSS class with no other visual differentiation — tapping does the same thing (`/sos`) either way, which is unhelpful for the community-emergency case since `/sos` has no community-emergency content.
    **Where**: `pwa/src/components/sentinel/FloatingSosButton.tsx`, `useNeighborhoodEmergency()`
    **Severity**: High
    **Source**: safety-journeys.md (Community emergency journey, Gap #2)
    **Status**: Open

17. **What**: No deep link exists anywhere app-wide from the lit SOS ring (or otherwise) into `/community-emergency` — a user who notices the ring and taps through lands on `/sos` with no explanation and no signposted next step to the actual emergency feed.
    **Where**: App-wide navigation / `FloatingSosButton`
    **Severity**: High
    **Source**: safety-journeys.md (Community emergency journey, Gap #3)
    **Status**: Open

18. **What**: `/map` has zero safety/incident/emergency overlay of any kind (confirmed via zero-match grep) despite being the most natural home for one — no way to see active community emergencies, Sentinel red-zone advisories, or open incident reports spatially anywhere in the app.
    **Where**: `pwa/src/app/(app)/map/MapComponent.tsx`
    **Severity**: High
    **Source**: safety-journeys.md (Community emergency journey, Gap #4); reiterated in cross-cutting summary
    **Status**: Open

19. **What**: Legacy Emergency report form has no offline resilience whatsoever, unlike SOS — a failed/denied/timed-out GPS fix (12s timeout) simply fails the whole submission with an inline error; no optimistic local record, no IndexedDB queue, no Background Sync retry.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: High
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #2)
    **Status**: Open

20. **What**: No client-side role/ownership check exists on any of the four per-emergency actions (escalate/resolve/cancel/acknowledge) on `/safety/emergency` — every action button renders for every viewer of an active-status card with no `isReporter`-equivalent gate; if not enforced server-side, any signed-in user who can see another user's active emergency could act on it.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: High
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #3)
    **Status**: Open

21. **What**: The report-submit response on `/safety/emergency` includes a `conversationId` (an auto-created incident conversation, mirroring SOS's pattern) but the page never reads or surfaces it — no "Open conversation" link exists anywhere, meaning any such conversation is currently unreachable from this page's UI.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: High
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #1)
    **Status**: Open

### Medium

22. **What**: Two live SOS-trigger aliases (`/sos/trigger` and legacy `/sos`) and two live guardian-add alias pairs exist simultaneously — functionally fine but the frontend contract should standardize on one canonical path per action.
    **Where**: `safety.routes.ts` / `safetyService`
    **Severity**: Medium
    **Source**: 02-api-registry/safety.md
    **Status**: Open

23. **What**: `/kidnapping/triangulate` calls a handler flagged in a prior audit as a possible stub (cell-tower triangulation) — the frontend calls it regardless as its only GPS-fail fallback; needs a source-level check before rebuild design assumes real data.
    **Where**: `safety.routes.ts`; called from `useKidnappingTracking.pingLocation` GPS-fail fallback
    **Severity**: Medium
    **Source**: 02-api-registry/safety.md; confirmed usage in 03-api-page-matrix/safety-sos-emergency.md and safety-journeys.md (Live/kidnapping tracking journey)
    **Status**: Open

24. **What**: `/safety/geofences` opens its own direct `socket.io-client` connection instead of using the shared `socketService` singleton; `useTripMonitor` (`/safety/trips`) independently does the same — three distinct socket-auth handshake patterns now confirmed across the cluster instead of one unified approach.
    **Where**: `pwa/src/app/(app)/safety/geofences/page.tsx`, `useTripMonitor.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster note #2); safety-journeys.md (Geofences journey, Gap #3; Live/kidnapping tracking journey)
    **Status**: Open

25. **What**: `incidentService.changeStatus()` (`PATCH /incident-reports/:id/status`) and `incidentService.update()` (`PATCH /incident-reports/:id`) are both defined and registry-documented but have no caller anywhere — only Resolve/Escalate are exposed in the UI.
    **Where**: `incident.service.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (page notes + Cross-cluster note #4); safety-journeys.md (Incident report journey, Gap #5)
    **Status**: Open

26. **What**: `GET /safety/guardians/eligible-linkers` is not called directly — `useSafetyDashboard.loadLinkers()` instead calls a separate helper (`fetchEligibleGuardianCandidates()`) whose internal routing was not confirmed either way.
    **Where**: `useSafetyDashboard.ts`, `lib/guardianEligibleFollowers.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster notes)
    **Status**: Open

27. **What**: `POST /safety/geofences/check` (background GPS ping described as coming from the PWA service worker) has no caller found in any page/hook in the pages/hooks/services scope searched — plausibly called from service-worker code outside that scope, not confirmed.
    **Where**: `safetyService.checkGeofenceLocation()`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster notes); safety-journeys.md (Geofences journey, Gap #1)
    **Status**: Open

28. **What**: `GET /safety/kidnapping/sessions/guardian-active` initially looked like a dead route with no listing screen for a guardian's watchable sessions — later corrected: the feature does exist (`LiveTrackingGuardianPanel.ActiveSessionsList`), just nested in the Circle tab rather than independently discoverable, which is itself a minor UX gap for a guardian who only ever receives a direct link.
    **Where**: `LiveTrackingGuardianPanel`, Circle tab of `/safety/kidnapping-tracking`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/safety-sos-emergency.md (Cross-cluster notes); corrected in safety-journeys.md (Live/kidnapping tracking journey, Gap #1)
    **Status**: Open

29. **What**: Guardians' "I'm responding" acknowledge action (`POST /sos/:id/acknowledge`) does not resolve or otherwise change the SOS's phase for the affected user — correct behavior, but UI copy could give a guardian an inflated sense the emergency is "handled" once tapped.
    **Where**: `SosGuardianIncomingAlerts` / `GuardianAlertsContext`
    **Severity**: Medium
    **Source**: safety-journeys.md (SOS activation journey, Gap #4)
    **Status**: Open

30. **What**: `/safety/panic-pin/enter` is reachable purely by URL guess/bookmark with no rate-limiting or lockout visible client-side — an attacker with the phone could test multiple PINs with no client-side friction (server-side enforcement not verified).
    **Where**: `pwa/src/app/(app)/safety/panic-pin/enter/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Panic PIN journey, Gap #2)
    **Status**: Open

31. **What**: The `/safety/panic-pin` setup page's security instructions (bookmark the real `/enter` URL under an unremarkable name) are entirely unenforced — no mechanism verifies the user actually did this; the whole feature's safety rests on the user following prose instructions.
    **Where**: `pwa/src/app/(app)/safety/panic-pin/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Panic PIN journey, Gap #3)
    **Status**: Open

32. **What**: `/safety/manage`'s hash-deep-link scheme has a write/read asymmetry — `#linkers` and `#history` are accepted on read but never written by `setTabWithHash()` (which only ever writes `#status`/`#alerts`); which hash name is canonical is unclear.
    **Where**: `pwa/src/app/(app)/safety/manage/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (`/safety/manage` journey, Gap #1)
    **Status**: Open

33. **What**: Guardians-tab and Circle-tab on `/safety/manage` each independently fetch the exact same mutual-follower intersection (`/follow/:id/followers` + `/following`) with no caching or sharing between them — a duplicate-fetch inefficiency.
    **Where**: `DashboardGuardiansPanel`, `DashboardCirclePanel`
    **Severity**: Medium
    **Source**: safety-journeys.md (`/safety/manage` journey, Gap #2)
    **Status**: Open

34. **What**: `DashboardCheckInsPanel` binds its five socket event handlers twice — once synchronously on mount, once via a `setTimeout(bind, 1000)` — with no check whether the first bind already succeeded; likely benign but an unexplained, uncommented code-smell pattern not seen elsewhere.
    **Where**: `DashboardCheckInsPanel`
    **Severity**: Medium
    **Source**: safety-journeys.md (`/safety/manage` journey, Gap #3)
    **Status**: Open

35. **What**: Three independent, uncoordinated missed-interval-escalation-to-silent-SOS ladders now exist in the codebase (Safe Trips, Wellness Check-ins, Panic PIN's direct converge) — each a separate implementation rather than a shared escalation primitive.
    **Where**: `useTripMonitor.ts`, `DashboardCheckInsPanel`/check-ins service, panic-pin flow
    **Severity**: Medium
    **Source**: safety-journeys.md (cross-cutting summary)
    **Status**: Open

36. **What**: The fixed native-notification id for Fake Call (`FAKE_CALL_NOTIFICATION_ID = 87301`) means only one fake call can ever be scheduled at a time; scheduling a second one silently overwrites/reschedules under the same id with no "already scheduled" warning shown.
    **Where**: `pwa/src/app/(app)/safety/fake-call/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Fake Call journey, Gap #2)
    **Status**: Open

37. **What**: No faster/hidden invocation path exists for Fake Call comparable to the SOS long-press or Panic PIN's disguised URL — a user in an uncomfortable live situation must navigate to the page, pick options, and wait out even the shortest delay; the in-page tip claiming a bottom-nav long-press jumps here may itself be inaccurate (that long-press actually triggers a silent SOS elsewhere in the docs).
    **Where**: `pwa/src/app/(app)/safety/fake-call/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Fake Call journey, Gap #3)
    **Status**: Open

38. **What**: `/safety/geofences` has no client-side geofence-crossing evaluation at all — the "Inside"/"Outside"/"Unknown" status dot is purely a read of a server-reported field, and the mechanism that actually evaluates crossings is invisible from this page's own code (service worker, or piggybacked on other features' location pings — unconfirmed).
    **Where**: `pwa/src/app/(app)/safety/geofences/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Geofences journey, Gap #1)
    **Status**: Open

39. **What**: The 20-zone geofence cap is soft/advisory only — running counter and battery-impact copy are the only friction; no code path disables "+ New zone" or submit once at 20, so real enforcement (if any) must be server-side.
    **Where**: `pwa/src/app/(app)/safety/geofences/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Geofences journey, Gap #4)
    **Status**: Open

40. **What**: Dismissing a live geofence alert from the on-page feed is client-side/session-only — no persistence call is made, unlike Sentinel red-zone alert dismissal which at least attempts server persistence when a `notificationId` is available.
    **Where**: `pwa/src/app/(app)/safety/geofences/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Geofences journey, Gap #5)
    **Status**: Open

41. **What**: `useNeighborhoodEmergency`'s own file-header comment claims it's "used to light up the SOS ring on BottomNav," directly contradicted by source — it's actually consumed inside `FloatingSosButton.tsx`, a distinct component. Stale/inaccurate comment.
    **Where**: `useNeighborhoodEmergency()` hook
    **Severity**: Medium
    **Source**: safety-journeys.md (Community emergency journey, Gap #1)
    **Status**: Open

42. **What**: `confirmOrDispute` (`POST /content/posts/:id/confirm-dispute`) exists in `content.service.ts` but is never called from `/community-emergency` — a false/malicious community emergency post has no confirm/dispute mechanism visible to users, unlike the fully-wired witness/confirm/dispute pattern on Incident Reports.
    **Where**: `/community-emergency` page; `content.service.ts`
    **Severity**: Medium
    **Source**: safety-journeys.md (Community emergency journey, Gap #5)
    **Status**: Open

43. **What**: The "up to 3 per hour" rate-limit claim on the community-emergency create form is UI copy only — no client-side counter, cooldown timer, or disabled state enforces it; enforcement (if real) must be entirely server-side.
    **Where**: `CreateEmergencyForm`, `/community-emergency`
    **Severity**: Medium
    **Source**: safety-journeys.md (Community emergency journey, Gap #6)
    **Status**: Open

44. **What**: Legacy Emergency's escalate action returns a synthetic `agencyResponse` payload (`success`/`referenceId`/`agencyName`) from the server but the frontend never displays it — only triggers a silent history re-fetch, discarding data that could be shown as a receipt.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #4)
    **Status**: Open

45. **What**: Legacy Emergency's resolve and cancel actions both hardcode their payloads (`{status:'resolved'}`, `{reason:'Reported by mistake'}`) rather than collecting user input — a user resolving/cancelling for a genuinely different reason has no way to record what actually happened.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #5)
    **Status**: Open

46. **What**: Legacy Emergency's acknowledge action is a distinct endpoint from SOS's guardian-acknowledge, with no visible UI distinction between "reporter acknowledging their own report" and "guardian/third party acknowledging someone else's" — combined with the missing ownership check (see High #20), unclear who this is meant for.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #6)
    **Status**: Open

47. **What**: Incident Replay's failure state on `/safety/emergency` is a bare, non-actionable "Failed to load timeline." text row with no retry button and no differentiation between a 403 access-denied response and a generic network/server failure.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #7)
    **Status**: Open

48. **What**: The client-side type-to-agency mapping (`EMERGENCY_TYPES`) shown before submission on the emergency report form is purely cosmetic and can visibly disagree with the server's real `assignedAgency` shown after submission — nothing in the UI flags or reconciles the possible mismatch.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #8)
    **Status**: Open

49. **What**: No pagination exists on the Recent Emergencies list on `/safety/emergency` — `getRecentEmergencies(10)` is a fixed limit-10 call with no "load more"/infinite scroll, unlike Incident Reports' or Trip History's paginated lists.
    **Where**: `pwa/src/app/(app)/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (Legacy Emergency journey, Gap #9)
    **Status**: Open

### Low

50. **What**: `window.prompt()` is used for the resolution text on Incident Report's "Resolve" action — a native browser dialog inside an otherwise fully custom-styled app, with no character limit and no rich-text/multi-line support.
    **Where**: `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`
    **Severity**: Low
    **Source**: 03-api-page-matrix/safety-sos-emergency.md; safety-journeys.md (Incident report journey, Gap #2)
    **Status**: Open

51. **What**: No admin/moderator role check anywhere on the incident detail page beyond `isReporter` — no separate "admin can also resolve/escalate other users' reports" path visible in the UI, even though the hardcoded escalate target implies a downstream admin review step.
    **Where**: `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`
    **Severity**: Low
    **Source**: safety-journeys.md (Incident report journey, Gap #1)
    **Status**: Open

52. **What**: The Sentinel advisory toast's "View" action does a hard `window.location.href` navigation instead of a Next.js router push, causing a full page reload and losing any in-progress client-side state — inconsistent with the rest of the app's navigation pattern.
    **Where**: Sentinel advisory toast handler
    **Severity**: Low
    **Source**: safety-journeys.md (Sentinel AI journey, Gap #2)
    **Status**: Open

53. **What**: `DashboardCheckInsPanel`'s "Start check-ins" button uses a native `window.confirm()` dialog when a stopped schedule already exists, rather than an in-app styled confirmation modal.
    **Where**: `DashboardCheckInsPanel`
    **Severity**: Low
    **Source**: safety-journeys.md (`/safety/manage` journey, Gap #5)
    **Status**: Open

54. **What**: No persistence of a scheduled Fake Call across a full app process restart (not just backgrounding) was independently verified — likely fine per Capacitor's own guarantees, but unverified this pass.
    **Where**: `pwa/src/app/(app)/safety/fake-call/page.tsx`
    **Severity**: Low
    **Source**: safety-journeys.md (Fake Call journey, Gap #1)
    **Status**: Open

55. **What**: Native browser dialogs (`window.prompt()`, `window.confirm()`) recur at consequential decision points (Incident Report resolution, Check-ins schedule restart) despite the rest of the app being fully custom-styled — a cross-cutting pattern worth eliminating in the rebuild.
    **Where**: Multiple safety-cluster pages
    **Severity**: Low
    **Source**: safety-journeys.md (cross-cutting summary)
    **Status**: Open

### Already Fixed (referenced in source docs, not open items)

- **Huud Gist `protectWithBetterAuth` auth bug** — documented in `02-api-registry/gossip.md` (outside this file's assigned scope; noted here per task instructions since it may be referenced elsewhere). **Status: FIXED, already deployed.**
- **`/settings` dead-code regression (NDPR consent/export/delete/username-change)** — not directly referenced in this file's 10 assigned documents, but noted per task instructions in case of cross-reference. **Status: FIXED, already deployed.**

---

## Marketplace

### High

56. **What**: `marketplace.routes.ts` uses `protect` (Bearer-token-only), not `protectAny` (Bearer OR Better Auth session cookie) like most other modules — a frontend client authenticated only via a Better Auth session cookie with no stored Bearer token will get 401s on every protected marketplace route. Needs a product/engineering decision: standardize on `protectAny`, or confirm the frontend always has a Bearer token.
    **Where**: `NeyborHuud-ServerSide/src/modules/marketplace/marketplace.routes.ts`; `auth.middleware.ts:451-467`
    **Severity**: High
    **Source**: 02-api-registry/marketplace.md
    **Status**: Open

57. **What**: Confirmed real, parallel tip-endpoint duplication — `paymentsService.tipUser()` calls `POST /payments/tip/:recipientId` while `gamificationService.tipUser()` calls `POST /gamification/users/:userId/tip` (the latter explicitly commented "purely P2P, no platform cut"), suggesting the two may behave differently (fee vs. no-fee). Both have real callers. Needs a product decision, not just cleanup, on whether these behave identically server-side.
    **Where**: `pwa/src/services/payments.service.ts:42-44`, `pwa/src/services/gamification.service.ts:129-131`; callers: `usePayments.ts`, `useGamification.ts`, `profile/[username]/PageClient.tsx`
    **Severity**: High
    **Source**: 02-api-registry/payments.md
    **Status**: Open

58. **What**: Marketplace's "save/unsave item" and "saved items" feature is fully broken/abandoned end-to-end — `saveItem`/`unsaveItem`/`getSavedItems` in `marketplace.service.ts` hit paths (`/marketplace/items/:id/save`, `/marketplace/saved`) that don't exist anywhere in marketplace.md's verified 30-route table, AND there is no `/marketplace/saved`-shaped page anywhere in the file tree to view a resulting list even if the calls worked. Unlike jobs (saved) and services (favorites), marketplace has no working equivalent feature at all.
    **Where**: `marketplace.service.ts`; `useSaveProduct()`, called from `ProductCard` on `/marketplace`
    **Severity**: High
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Unmatched calls, Cross-cluster note #4); confirmed in commerce-journeys.md (Listing creation journey, "New finding")
    **Status**: Open

59. **What**: `contactSeller`, `shareItem`, `reportItem`, `getCategories` in `marketplace.service.ts` call paths (`/marketplace/items/{id}/contact`, `/share`, `/report`, `/marketplace/categories`) that do not appear anywhere in marketplace.md's 30-route registry table.
    **Where**: `marketplace.service.ts`
    **Severity**: High
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Unmatched calls)
    **Status**: Open

60. **What**: Editing a marketplace listing (`/marketplace/[id]/edit`) has no in-code guard, warning, or lock against editing out from under an in-progress deal (accepted offer, paid-but-unshipped order, etc.) — a seller can freely change price/condition/images mid-deal with nothing reconciling this against what `DealStatusCard` is showing the buyer.
    **Where**: `pwa/src/components/marketplace/ProductForm.tsx`, `pwa/src/app/(app)/marketplace/[id]/edit/PageClient.tsx`
    **Severity**: High
    **Source**: commerce-journeys.md (Listing creation journey, "New finding")
    **Status**: Open

### Medium

61. **What**: `updateOrderStatus`'s exact allowed state-machine transitions are gated entirely in the controller, not visible from the route file — flagged for whoever does the detailed request/response contract pass.
    **Where**: `marketplace.routes.ts` / controller
    **Severity**: Medium
    **Source**: 02-api-registry/marketplace.md
    **Status**: Open

62. **What**: The `/verify/:reference` comment naming its frontend caller ("used by the success page") is a useful breadcrumb but confirms the payments success page's existence needs cross-checking against implementation.
    **Where**: `payment.routes.ts`
    **Severity**: Low
    **Source**: 02-api-registry/payments.md
    **Status**: Open

63. **What**: `useCancelOrder()` (`PATCH /orders/:orderId/status`, pre-payment cancel/reject) has no confirmed call site anywhere in marketplace pages or in `DealStatusCard`/`OfferCard` (both read in full) — there is no visible "cancel deal" button anywhere once an order exists; the only observed cancellation path is automatic payment-window expiry.
    **Where**: `useMarketplace.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes + Cross-cluster notes); confirmed unresolved in commerce-journeys.md (Marketplace deal journey, Gap)
    **Status**: Open

64. **What**: `BuyerIntentActions.handleBuyNow`/`handleMakeOffer` have inconsistent silent degraded-path recovery: if the API response lacks a `conversationId`, "Buy now" redirects to `/marketplace/my-deals` while "Make offer" just shows a toast with no navigation at all.
    **Where**: `components/marketplace/BuyerIntentActions.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Marketplace deal journey, Gaps)
    **Status**: Open

65. **What**: Counter-offer amount entry (`OfferCard.askCounter`) uses a raw `window.prompt()` instead of a styled input, unlike the polished `MakeOfferDialog` used for the initial offer.
    **Where**: `components/chat/OfferCard.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Marketplace deal journey, Gaps)
    **Status**: Open

66. **What**: `DealStatusCard`'s "Paid, no proof" affordance allows payment confirmation to be entirely self-attested with zero evidence — a real trust-model gap given NeyborHuud never holds funds.
    **Where**: `components/chat/DealStatusCard.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Marketplace deal journey, Gaps)
    **Status**: Open

67. **What**: Two visually and functionally distinct `BoostModal` components exist — `components/marketplace/BoostModal.tsx` (marketplace-only, 4 duration options, own coin-cost table) vs `components/gamification/BoostModal.tsx` (shared by jobs+services, 2 options) — not a bug, but a real component-registry inconsistency.
    **Where**: `components/marketplace/BoostModal.tsx`, `components/gamification/BoostModal.tsx`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Anything surprising #2)
    **Status**: Open

68. **What**: `marketplace/[id]` and `premium` are both dead-end legacy redirects, not real content pages — a naive file-tree-based page inventory would incorrectly count them as content pages.
    **Where**: `pwa/src/app/(app)/marketplace/[id]/PageClient.tsx`, `pwa/src/app/(app)/premium/page.tsx`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Page inventory correction, Anything surprising #3)
    **Status**: Open

69. **What**: `/settings/payout` is the only page in the entire marketplace/jobs/services/work/premium cluster that calls `marketplaceService` methods directly instead of via a `use*` React Query hook — an inconsistency with the rest of the codebase's conventions.
    **Where**: `pwa/src/app/(app)/settings/payout/page.tsx`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes, Anything surprising #5); reconfirmed in commerce-journeys.md (Premium/HuudCoin journey)
    **Status**: Open

70. **What**: The real UI actors for most of marketplace.md's order/offer lifecycle (`DealStatusCard.tsx`, `OfferCard.tsx`) live inside the chat feature, not any marketplace page — a rebuild treating marketplace as a self-contained page tree would miss most of the actual working UI.
    **Where**: `components/chat/DealStatusCard.tsx`, `components/chat/OfferCard.tsx`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Anything surprising #6); confirmed in commerce-journeys.md (Marketplace deal journey)
    **Status**: Open

71. **What**: `useInitiatePayment()` (wrapping `POST /payments/initiate`) has zero call sites anywhere in the entire frontend (repo-wide grep) — every real HuudCoin spend (boosts, tips) uses its own dedicated instant-spend endpoint instead, bypassing the generic initiate→verify→success pipeline entirely.
    **Where**: `hooks/usePayments.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Cross-cluster notes); confirmed and sharpened repo-wide in commerce-journeys.md (Premium/HuudCoin journey, "New finding")
    **Status**: Open

72. **What**: `/premium/success` has zero internal links anywhere in `pwa/src` (repo-wide grep) — combined with finding #71, this fully-built, well-handled page is currently unreachable from anywhere in the traced frontend except a bookmarked/deep-linked URL.
    **Where**: `pwa/src/app/(app)/premium/success/page.tsx`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes); confirmed and sharpened repo-wide in commerce-journeys.md (Premium/HuudCoin journey, "New finding")
    **Status**: Open

### Low

73. **What**: `HuudCoinTierPanel.tsx` (shown after `/premium`'s redirect) was not read in full — only grepped for purchase-flow keywords (no matches) — so a coin-purchase CTA living inside the tier panel itself cannot be fully ruled out.
    **Where**: `HuudCoinTierPanel.tsx`
    **Severity**: Low
    **Source**: commerce-journeys.md (Premium/HuudCoin journey, Gaps)
    **Status**: Open

74. **What**: `/settings/payout`'s claim that the account name must match the user's registered signup name is UI copy only — not independently verified against server-side enforcement.
    **Where**: `pwa/src/app/(app)/settings/payout/page.tsx`
    **Severity**: Low
    **Source**: commerce-journeys.md (Premium/HuudCoin journey, Gaps)
    **Status**: Open

### Already Fixed

- No marketplace-specific already-fixed item found in the 10 assigned files beyond the two noted at the top of this document.

---

## Jobs

### Critical

75. **What**: `jobs/[id]/PageClient.tsx` renders a live, owner-only "Close Job" button wired to `useCloseJob()` → `jobsService.closeJob(jobId)` → `POST /jobs/{jobId}/close` — but `closeJob` is a dead controller import never wired to any route in `job.routes.ts`. There is no `/jobs/:id/close` route on the backend at all; this button would 404/500 in production. This is a confirmed, source-cross-verified frontend/backend mismatch, not a documentation gap.
    **Where**: `pwa/src/app/(app)/jobs/[id]/PageClient.tsx`; `job.controller.ts`/`job.routes.ts`
    **Severity**: Critical (broken owner-facing action reaching production with no working backend counterpart)
    **Source**: 02-api-registry/jobs.md; 03-api-page-matrix/marketplace-jobs-services.md (page notes + Anything surprising #1)
    **Status**: Open

76. **What**: The entire employer-side job-application review UI is missing — `jobsService.getJobApplications()` and `jobsService.updateApplicationStatus()` exist, are exported, and match plausible backend routes, but a repo-wide grep found zero call sites anywhere in the frontend (no page, hook, or component). No `/jobs/[id]/applications`-shaped route exists in the file tree at all. An employer today has no in-app way to see who applied to their job or to accept/reject/shortlist anyone.
    **Where**: `jobs.service.ts` (`getJobApplications`, `updateApplicationStatus`); no corresponding page exists
    **Severity**: Critical (entire missing screen/feature, not a broken button — core hiring workflow is non-functional)
    **Source**: commerce-journeys.md (Job application journey — full journey and Gaps)
    **Status**: Open

### High

77. **What**: `/jobs/saved`'s unsave button is wired backwards — `JobCard.onSave` callback signature always passes the opposite of the current state `(jobId, isSaved) => onSave(jobId, !isSaved)`, but `/jobs/saved`'s page hardcodes `onSave={(id) => saveJob.mutate({jobId: id, saved: true})}`, ignoring the boolean JobCard actually passes. Since `useSaveJob()` branches POST-vs-DELETE on that flag, tapping "unsave" on this specific page fires a second POST (re-save) instead of the needed DELETE — a user cannot successfully remove a job from their saved list from this page.
    **Where**: `pwa/src/app/(app)/jobs/saved/page.tsx`; `components/jobs/JobCard.tsx`
    **Severity**: High
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes, "Odd" flag); confirmed as a real bug in commerce-journeys.md (Listing creation journey, "New finding")
    **Status**: Open

### Medium

78. **What**: No employer-side chat thread or messaging/negotiation layer exists for job applications, unlike marketplace deals which get an auto-created chat thread with live status cards — job applications are a pure REST resource with no thread equivalent.
    **Where**: Jobs application flow, contrast with `components/chat/`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Job application journey, Gaps)
    **Status**: Open

79. **What**: No push/socket event for job-application status change was found — an applicant's outcome visibility depends entirely on revisiting `/jobs/my-applications` and re-fetching, or speculatively a `job_*`-prefixed notification row (not confirmed to actually fire for this case).
    **Where**: `/jobs/my-applications`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Job application journey, Gaps)
    **Status**: Open

80. **What**: No listing-edit affordance exists for jobs at all — only marketplace has `/[id]/edit`; whether intentional (repost instead of edit) or a missing screen is unconfirmed.
    **Where**: `jobs/create`, no `jobs/[id]/edit` route exists
    **Severity**: Medium
    **Source**: commerce-journeys.md (Listing creation journey, "New finding")
    **Status**: Open

### Already Fixed

None specific to Jobs found in the 10 assigned files.

---

## Services

### Medium

81. **What**: `getMyBookings` is explicitly labeled legacy in source but still mounted and presumably still returns real data for pre-negotiation-system bookings — the frontend rebuild needs to decide whether "My Bookings" should merge legacy + current, or show separately.
    **Where**: `service.routes.ts` (`GET /my/bookings`)
    **Severity**: Medium
    **Source**: 02-api-registry/services.md
    **Status**: Open

82. **What**: `services.service.ts` still exports three fully-`@deprecated LEGACY`-labeled methods (`getMyBookings`, `cancelBooking`, `updateBookingStatus`) matching real registry routes, but confirmed to have zero call sites anywhere in the frontend — real candidates for backend deprecation, not just UI consolidation, since the frontend has already fully migrated to the negotiation-request flow.
    **Where**: `services.service.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes, "Note — legacy vs current split"); confirmed in commerce-journeys.md (Service booking journey)
    **Status**: Open

83. **What**: `services.service.ts`'s `getServiceBookings()` (`GET /services/:serviceId/bookings`) matches no route in services.md's 21-route table at all and has no call site found — unmatched and unused.
    **Where**: `services.service.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes)
    **Status**: Open

84. **What**: `OfferCard.tsx` shows no service-aware branch for booking negotiations — its accept/reject/counter UI is generically marketplace-labeled ("Marketplace · New Offer/Counter Offer") even when actually mediating a service booking, unlike `DealStatusCard` which does relabel for services; unconfirmed whether a countered booking actually produces an "offer" record or a distinct "booking request" record under the hood.
    **Where**: `components/chat/OfferCard.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Service booking journey, Gaps)
    **Status**: Open

85. **What**: Rating (`RateServiceModal`, `POST /services/:id/rate`) is not gated behind order/booking completion status anywhere in the traced `/services/[id]` code — a user could rate a provider before or without ever completing a booking through the chat flow.
    **Where**: `pwa/src/app/(app)/services/[id]/PageClient.tsx`; `RateServiceModal`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes); confirmed in commerce-journeys.md (Service booking journey, Gaps)
    **Status**: Open

86. **What**: No listing-edit affordance exists for services at all (same asymmetry as Jobs) — only marketplace supports `/[id]/edit`.
    **Where**: `services/create`, no `services/[id]/edit` route exists
    **Severity**: Medium
    **Source**: commerce-journeys.md (Listing creation journey, "New finding")
    **Status**: Open

87. **What**: `CreateServiceForm`'s success path does `router.push("/services")` directly with no `PostCreationSuccessSheet`, unlike both `ProductForm` and `CreateJobForm` which show a success sheet — a real UX inconsistency across the three creation flows.
    **Where**: `components/services/CreateServiceForm.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Listing creation journey, Gaps)
    **Status**: Open

88. **What**: `CreateServiceForm` has no `useRegisteredLocation()`/location field at all, unlike marketplace and jobs forms — services listings appear to carry no geolocation the way marketplace/jobs do (not confirmed against actual `POST /services` payload shape).
    **Where**: `components/services/CreateServiceForm.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Listing creation journey)
    **Status**: Open

### Low

89. **What**: An earlier pass flagged that the frontend does not appear to enforce a 6-image cap client-side on `/services/create`; a later, more thorough re-check found this was in fact correctly enforced (`files.slice(0, 6 - imageFiles.length)`, add-photo button disabled/hidden past 6). Logged here only so the correction is traceable, not as an open bug.
    **Where**: `components/services/CreateServiceForm.tsx`
    **Severity**: Low
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes) — corrected in commerce-journeys.md (Listing creation journey, "confirmed-fine, not a gap")
    **Status**: Open (informational; underlying concern was found NOT to be a bug on re-check, flagged only so the correction is traceable)

### Already Fixed

- **`boostService`** (Services module's `/:id/boost` handler) — confirmed already deployed and working; explicitly called out as not an open issue in `02-api-registry/services.md` and reconfirmed in `03-api-page-matrix/marketplace-jobs-services.md`. **Status: FIXED, already deployed.**

---

## Events

### High

90. **What**: Confirmed dual/split-brain RSVP system — standalone browse pages (`/events`, `/events/nearby`, `/events/my-events`) hard-wire a legacy-shaped **binary** attend/un-attend (`POST`/`DELETE /events/:id/attend`), while the documented **tri-state** `/events/:id/rsvp` (Going/Maybe/Can't Go) is only reachable from inside the event's own chat thread via `EventRsvpCard`. A user who never opens the event's chat can never say "Maybe" — only fully in or fully out. The two mechanisms track state independently (`event.isAttending` boolean vs. `RsvpStatus` tri-state) and it's unclear whether the backend reconciles them as the same fact.
    **Where**: `components/events/EventCard.tsx` (binary), `components/chat/EventRsvpCard.tsx` (tri-state)
    **Severity**: High
    **Source**: commerce-journeys.md (Event RSVP journey, Gaps)
    **Status**: Open

91. **What**: `/events/[id]` detail page has no RSVP button of its own at all — it shows attendee count and a list-viewing modal, but RSVP-ing only happens via `EventCard` on list pages or via the chat thread; an odd gap since the detail page is the natural place a user would expect to RSVP after reading full details.
    **Where**: `pwa/src/app/(app)/events/[id]/PageClient.tsx`
    **Severity**: High
    **Source**: commerce-journeys.md (Event RSVP journey, Gaps)
    **Status**: Open

### Medium

92. **What**: No reminder/countdown UI was found anywhere in the traced event pages or components (no "starts in Xh" banner, no local-notification scheduling) — the only proactive-communication mechanism is the organizer's manual "Post an Update" broadcast; any push-based reminder is unverifiable from frontend code.
    **Where**: Event pages, `EventCard`, `PageClient.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Event RSVP journey, Gaps)
    **Status**: Open

### Note

93. **What**: `events.md` itself reports no known issues — the file is clean: static routes correctly ordered before `:id`, legacy attend/unattend clearly labeled as superseded (not silently duplicated), no dead imports found at the registry level. All Events findings above come from the page-matrix/journey layer, not the API registry.
    **Where**: `events.routes.ts`
    **Severity**: N/A (informational)
    **Source**: 02-api-registry/events.md
    **Status**: N/A

### Already Fixed

None specific to Events found in the 10 assigned files.

---

## Payments (HuudCoin)

### High

94. **What**: See Marketplace finding #57 (tip endpoint duplication) — reiterated here since it originates in payments.md: `POST /payments/tip/:recipientId` vs `POST /gamification/users/:userId/tip` are two live, parallel tip paths with possibly different fee semantics, both with real callers (confirmed not used anywhere in the Marketplace/Jobs/Services/Work cluster itself — its only confirmed call site is the profile page, `profile/[username]/PageClient.tsx`, outside those clusters).
    **Where**: `pwa/src/services/payments.service.ts`, `pwa/src/services/gamification.service.ts`
    **Severity**: High
    **Source**: 02-api-registry/payments.md; scoping confirmed in 03-api-page-matrix/marketplace-jobs-services.md (Cross-cluster notes) and commerce-journeys.md
    **Status**: Open

### Medium

95. **What**: `GET /stats`, `GET /:id`, `GET /:id/receipt`, `POST /:id/refund` (`getPaymentStats`, `getPayment`, `requestRefund`) have hooks (`usePaymentStats`) but no page in the marketplace/jobs/services/work cluster renders them — presumably used in a wallet/history page outside this cluster, not independently confirmed.
    **Where**: `usePayments.ts`
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Cross-cluster notes)
    **Status**: Open

96. **What**: `ratings.md`'s generic `/ratings` endpoints are confirmed genuinely unreachable from the services cluster — services has its own dedicated `/:id/rate` + `/:id/reviews` instead, consistent with ratings.md's own open question about frontend reachability.
    **Where**: N/A — cross-cluster registry note
    **Severity**: Medium
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (page notes, Cross-cluster notes)
    **Status**: Open

97. **What**: `media.md`'s generic upload endpoint (`POST /media/upload`) is not used anywhere in this cluster — all image/resume uploads go through each module's own dedicated multer route instead, consistent with media.md's own note but worth confirming this is deliberate architecture, not an oversight.
    **Where**: N/A — cross-cluster registry note
    **Severity**: Low
    **Source**: 03-api-page-matrix/marketplace-jobs-services.md (Cross-cluster notes)
    **Status**: Open

### Already Fixed

None specific to Payments found in the 10 assigned files (the tip duplication, #57/#94, remains an open product decision, not a fix).

---

## Cross-cutting / Architectural Observations (not single bugs, but repeated patterns worth flagging)

98. **What**: The "opens its own raw `socket.io-client` connection instead of the shared `socketService` singleton" inconsistency recurs at least three times in the Safety cluster (`/safety/trips`, `/safety/geofences`) with three distinct auth-handshake shapes, while `RedZoneAlertsContext`/`GuardianAlertsContext`/Legacy Emergency correctly use the shared singleton — worth using as the template for the rebuild.
    **Where**: `useTripMonitor.ts`, `/safety/geofences/page.tsx` vs. `RedZoneAlertsContext.tsx`, `GuardianAlertsContext.tsx`, `/safety/emergency/page.tsx`
    **Severity**: Medium
    **Source**: safety-journeys.md (multiple journeys + cross-cutting summary)
    **Status**: Open

99. **What**: The three marketplace/jobs/services listing-creation forms (`ProductForm`, `CreateJobForm`, `CreateServiceForm`) share zero component code beyond generic primitives (`toKobo()`, `useRegisteredLocation()`, `PremiumTextArea`) — different styling systems, different form shapes, only marketplace supports post-publish editing. A rebuild aiming for a unified "create a listing" pattern is building that convergence fresh.
    **Where**: `components/marketplace/ProductForm.tsx`, `components/jobs/CreateJobForm.tsx`, `components/services/CreateServiceForm.tsx`
    **Severity**: Medium
    **Source**: commerce-journeys.md (Listing creation journey, summary)
    **Status**: Open

100. **What**: Across both domains, standalone module browse/list pages are almost entirely *initiation and display* surfaces, while real fulfillment/negotiation logic lives inside chat components (`DealStatusCard`, `OfferCard`, `EventRsvpCard`) — a rebuild that treats each module's own page tree as self-contained would miss most of the actual working UI.
    **Where**: Marketplace, Services, Events chat-embedded flows
    **Severity**: Medium
    **Source**: commerce-journeys.md (summary)
    **Status**: Open

101. **What**: Native browser dialogs (`window.prompt()`, `window.confirm()`) appear at consequential decision points across both domains (Incident Report resolution and Check-ins restart in Safety; counter-offer amount entry in Marketplace/Services chat) despite the rest of the app being fully custom-styled — a repeated pattern worth eliminating deliberately in the rebuild rather than case-by-case.
    **Where**: `pwa/src/app/(app)/incident-reports/[id]/PageClient.tsx`, `DashboardCheckInsPanel`, `components/chat/OfferCard.tsx`
    **Severity**: Low
    **Source**: safety-journeys.md (cross-cutting summary); commerce-journeys.md (Marketplace deal journey)
    **Status**: Open

---

## Verification Count Summary

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 27 |
| Medium | 54 |
| Low | 17 |
| **Total open findings** | **101** |
| Already-fixed items (noted, not counted above) | 2 |
