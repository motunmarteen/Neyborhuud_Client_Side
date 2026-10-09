# API Registry — Safety

> Mount: `app.use("/api/v1/safety", safetyRoutes)` — `app.ts:318`
> Source: `NeyborHuud-ServerSide/src/modules/safety/safety.routes.ts`
>
> **Total: 85 routes.** The single largest and most safety-critical module in the backend — SOS,
> guardians, trip monitoring, geofencing, panic PIN, wellness check-ins, safety circle, kidnapping
> tracking, incident replay. This module and its adjacent services (`safety.service.ts`,
> `trip.service.ts`, `geofence.service.ts`, `tracking.service.ts`) were the subject of extensive,
> separate deep code review in a prior session — see git history on `NeyborHuud-ServerSide` for real
> bugs found and fixed there (a broken trip-escalation duplicate, a premature dispatch-status bug,
> an SOS location-tracking schema mismatch). This registry pass does not re-litigate that work,
> only inventories the routes.
>
> `protectAny` = Bearer JWT or Better Auth session. `requireVerification` = profile-completeness
> gate. `requireAdmin` = admin role required. `sosLimiter`/`tripCheckInLimiter`/
> `tripLocationLimiter` = purpose-specific rate limits.

## Status Updates
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/status/update` | `protectAny`, validated | `updateStatus` |
| GET | `/status/guardians-feed` | `protectAny` | `getGuardiansFeed` |
| GET | `/status/:userId` | `protectAny` | `getUserStatus` |

## SOS System (current)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/sos/trigger` | rate-limited, `protectAny`, validated | `triggerSOS` | **Deliberately not gated by `requireVerification`** — an emergency action must not be blocked by an incomplete profile (explicit code comment) |
| POST | `/sos/drill` | rate-limited, `protectAny` | `triggerSosDrill` | Real drill — notifies real guardians, never creates an Emergency record or reaches agency dispatch, by design |
| POST | `/sos/:id/drill-acknowledge` | `protectAny` | `acknowledgeSosDrill` | |
| POST | `/sos/:id/acknowledge` | `protectAny` | `acknowledgeSos` | Guardian acknowledges |
| POST | `/sos/:id/resolve` | `protectAny` | `resolveSos` | |
| POST | `/sos/:id/cancel` | `protectAny` | `cancelSos` | |
| GET | `/sos/active` | `protectAny` | `getActiveSos` | |
| GET | `/sos/history` | `protectAny` | `getSosHistory` | |
| GET | `/sos/:id/summary` | `protectAny` | `getSosIncidentSummary` | Post-incident timeline + guardian response times |
| POST | `/sos/:id/note` | `protectAny` | `addSosIncidentNote` | |
| GET | `/guardian-activity/:sosEventId` | `protectAny` | `getGuardianActivity` | |

## Legacy Emergency (kept for backward compat)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/sos` | rate-limited, `protectAny`, validated | `triggerSOS` | Legacy alias of `/sos/trigger` |
| POST | `/emergency/report` | rate-limited, `protectAny`, validated | `reportEmergency` | |
| POST | `/emergency/:emergencyId/escalate` | rate-limited, `protectAny` | `escalateEmergency` | |
| POST | `/emergency/:emergencyId/cancel` | `protectAny` | `cancelEmergency` | |
| POST | `/emergency/:emergencyId/acknowledge` | `protectAny` | `acknowledgeEmergency` | |
| POST | `/emergency/:emergencyId/resolve` | `protectAny` | `resolveEmergency` | |
| GET | `/emergency/active` | `protectAny` | `getActiveEmergencies` | |
| GET | `/emergency/history` | `protectAny` | `getEmergencyHistory` | |
| GET | `/emergency/stats` | `protectAny` | `getEmergencyStats` | |

**⚠️ Source-code note (not my finding — pre-existing comment in `safety.routes.ts:135-141`):** a
prior legacy tracking pair (`/emergency/track`, `/emergency/tracking/history`),
`/emergency/:emergencyId/analytics`, `/emergency/triangulate`, and `/emergency/carrier-ping` were
**removed** — fully superseded by the Kidnapping/Live Tracking session system below. The comment
explicitly notes the removed analytics endpoint had "a real cross-user data-leak bug" — worth
knowing if any old frontend code or docs still reference those paths, since they are gone, not
just deprecated.

## Guardians
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/guardians/request` | `protectAny`, validated | `addGuardian` | Current path |
| POST | `/guardians/respond` | `protectAny`, validated | `acceptGuardianRequest` | Current path |
| POST | `/guardians` | `protectAny`, validated | `addGuardian` | **Legacy alias**, kept for back-compat |
| POST | `/guardians/accept` | `protectAny` | `acceptGuardianRequest` | **Legacy alias** |
| GET | `/guardians` | `protectAny` | `getGuardians` | |
| GET | `/guardians/requests/incoming` | `protectAny` | `getIncomingGuardianRequests` | |
| DELETE | `/guardians/:guardianId` | `protectAny` | `removeGuardian` | |
| GET | `/guardians/eligible-linkers` | `protectAny` | `getMutualFollowsForGuardian` | Mutual-follow users eligible to be added as guardians |

## Trip Monitoring
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/trips/create` | `protectAny`, validated | `createTrip` | Planned, not yet monitored |
| POST | `/trips/start` | `protectAny`, validated | `startTrip` | Create + activate in one call — most common path |
| POST | `/trips` | `protectAny`, validated | `startTrip` | **Legacy alias** of `/trips/start` |
| POST | `/trips/:id/activate` | `protectAny` | `activateTrip` | |
| POST | `/trips/:id/checkin` | `protectAny`, rate-limited, validated | `checkInTrip` | |
| POST | `/trips/:id/location` | `protectAny`, rate-limited, validated | `updateTripLocation` | |
| POST | `/trips/:id/complete` | `protectAny` | `completeTrip` | |
| POST | `/trips/:id/cancel` | `protectAny`, validated | `cancelTrip` | |
| POST | `/trips/:id/pause` | `protectAny` | `pauseTrip` | |
| POST | `/trips/:id/resume` | `protectAny` | `resumeTrip` | |
| PATCH | `/trips/:id` | `protectAny` | `updateTrip` | **Legacy** |
| POST | `/trips/:id/end` | `protectAny` | `endTrip` | **Legacy** |
| GET | `/trips/active` | `protectAny` | `getActiveTrip` | |
| GET | `/trips` | `protectAny` | `listTrips` | |
| GET | `/trips/:id` | `protectAny` | `getTripById` | |
| GET | `/trips/guardian-view/:userId` | `protectAny` | `getTripGuardianView` | |
| POST | `/trips/check-escalations` | `protectAny`, `requireAdmin` | `checkTripEscalation` | Manual/admin trigger — the real automatic path is the scheduler, per prior session's audit of `trip.service.ts` |

## Safety Settings
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/settings` | `protectAny` | `getSafetySettings` |
| PATCH | `/settings` | `protectAny` | `updateSafetySettings` |

## Panic PIN (duress code)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/panic-pin/status` | `protectAny` | `getPanicPinStatus` | Boolean only — never returns the PIN |
| POST | `/panic-pin` | `protectAny`, validated | `setPanicPin` | Requires `currentPin` if one already exists |
| DELETE | `/panic-pin` | `protectAny`, validated | `removePanicPin` | Requires `currentPin` |
| POST | `/panic-pin/verify` | rate-limited (`sosLimiter`), `protectAny`, validated | `verifyPanicPin` | If it matches, **silently** triggers a silent SOS — rate-limited specifically to prevent brute-force PIN enumeration |

## Geofencing
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/geofences` | `protectAny`, validated | `createGeofence` | |
| GET | `/geofences` | `protectAny` | `listGeofences` | |
| PATCH | `/geofences/:id` | `protectAny`, validated | `updateGeofence` | |
| DELETE | `/geofences/:id` | `protectAny` | `deleteGeofence` | |
| POST | `/geofences/check` | `protectAny`, validated | `checkLocationForGeofences` | Background GPS ping from the PWA service worker |

## Wellness Check-Ins (standalone, trip-independent)
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/checkins/start` | `protectAny`, validated | `startWellnessCheckIn` |
| GET | `/checkins/active` | `protectAny` | `getActiveWellnessCheckIn` |
| POST | `/checkins/checkin` | `protectAny` | `submitWellnessCheckIn` |
| POST | `/checkins/pause` | `protectAny` | `pauseWellnessCheckIn` |
| POST | `/checkins/resume` | `protectAny` | `resumeWellnessCheckIn` |
| POST | `/checkins/stop` | `protectAny` | `stopWellnessCheckIn` |

## Safety Circle (opt-in, view-only status access for mutual followers)
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/circle/invite` | `protectAny`, validated | `inviteToCircle` |
| POST | `/circle/invites/:inviteId/respond` | `protectAny`, validated | `respondToCircleInvite` |
| DELETE | `/circle/:memberId` | `protectAny` | `removeCircleMember` |
| GET | `/circle/mine` | `protectAny` | `getMyCircle` |
| GET | `/circle/incoming` | `protectAny` | `getIncomingCircleInvites` |
| GET | `/circle/belong-to` | `protectAny` | `getCirclesIBelongTo` |

## Admin
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/admin/metrics` | `protectAny`, `requireAdmin` | `getSafetyDashboardMetrics` |
| GET | `/admin/ops-status` | `protectAny`, `requireAdmin` | `getOpsStatus` |

## Kidnapping Tracking System
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/kidnapping/sessions/start` | rate-limited, `protectAny`, `requireVerification` | `startKidnappingTracking` | Manual start — auto-start on SOS handled server-side in `safety.service.ts` |
| GET | `/kidnapping/sessions/active` | `protectAny` | `getActiveKidnappingSession` | |
| GET | `/kidnapping/sessions/guardian-active` | `protectAny` | `getActiveKidnappingSessionsForGuardian` | All live sessions the caller can watch |
| POST | `/kidnapping/sessions/:sessionId/location` | `protectAny`, rate-limited | `logKidnappingLocation` | High-frequency |
| POST | `/kidnapping/sessions/:sessionId/location/batch` | `protectAny`, rate-limited | `batchLogKidnappingLocations` | |
| GET | `/kidnapping/sessions/:sessionId` | `protectAny` | `getKidnappingSession` | Owner or guardian |
| GET | `/kidnapping/sessions/:sessionId/history` | `protectAny` | `getKidnappingLocationHistory` | Time-sliceable |
| GET | `/kidnapping/sessions/:sessionId/latest` | `protectAny` | `getKidnappingLatestLocation` | |
| GET | `/kidnapping/sessions/:sessionId/summary` | `protectAny` | `getKidnappingTrackingSummary` | |
| POST | `/kidnapping/sessions/:sessionId/stop` | `protectAny` | `stopKidnappingTracking` | |
| POST | `/kidnapping/triangulate` | `protectAny` | `triangulateKidnappingLocation` | Network-triangulation fallback — flagged as a stub in Step 1 audit, not re-verified this pass |

## Incident Replay
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/emergency/:emergencyId/replay` | `protectAny` | `getIncidentReplay` | Unified forensic timeline (location + chat + system events). Access: victim, their guardians, admins |

## Known issues found while building this registry

- **Two live SOS-trigger aliases** (`/sos/trigger` and legacy `/sos`) and **two live guardian-add
  aliases** (`/guardians/request`/`/guardians` and `/guardians/respond`/`/guardians/accept`) —
  functionally fine (both work), but a rebuilt frontend contract should standardize on one canonical
  path per action and treat the other as deprecated-but-supported, not use both interchangeably.
- `/kidnapping/triangulate` calls a handler the Step 1 audit flagged as a possible stub
  (cell-tower-triangulation, invisible to the frontend either way) — worth a source-level check
  before the rebuild's design work assumes this returns real data.
