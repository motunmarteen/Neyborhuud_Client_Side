# API Registry — Geo / Communities / Governance

> Mount: `app.use("/api/v1/geo", geoRoutes)` — `app.ts:320`
> Source: `NeyborHuud-ServerSide/src/modules/geo/geo.routes.ts`
>
> **Total: 19 routes.** Mixed public/`protect` (Bearer-only — see `_auth-middleware-split.md`).
> Two controllers share this mount: `geo.controller.ts` (location/community core) and
> `governance.controller.ts` (proposals, voting, account sovereignty/deletion).

## Public (no auth)
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/boundaries` | `getAdminBoundaries` | |
| GET | `/communities` | `listCommunities` | |
| POST | `/preview` | `previewLocation` | Labeled "New public preview endpoint" in source |
| GET | `/community-picker-options` | `getCommunityPickerOptionsPublic` | Onboarding community picker |
| GET | `/nigeria-postal-reference` | `getNigeriaPostalReference` | |
| GET | `/lga-centroid` | `getLgaCentroid` | LGA = Local Government Area (Nigerian admin unit) |
| GET | `/reverse-geocode` | `reverseGeocode` | |

## Communities
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/communities` | `protect` | `createCommunityResource` | |
| POST | `/communities/:communityId/join` | `protect` | `requestToJoin` | |
| POST | `/communities/:communityId/verify` | `protect`, validated | `verifyMemberLocation` | |
| GET | `/communities/:communityId/challenges` | `protect` | `getVerificationChallenges` | Location-verification challenge questions |
| POST | `/communities/:communityId/challenges/answer` | `protect` | `answerChallenge` | |
| GET | `/communities/:communityId/network` | `protect` | `getNetworkContext` | |
| GET | `/communities/:communityId/emergency-zones` | `protect` | `getEmergencyZones` | |

## Governance & Sovereignty (Phase 25, per source comment)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/proposals` | `protect` | `governanceController.createProposal` | |
| GET | `/proposals/:id` | `protect` | `governanceController.getProposal` | |
| POST | `/proposals/:proposalId/vote` | `protect` | `governanceController.castVote` | |
| POST | `/sovereignty/delete-account` | `protect` | `governanceController.requestDeletion` | Account deletion request |
| POST | `/sovereignty/cancel-deletion` | `protect` | `governanceController.cancelDeletion` | |

## Social Discovery
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/nearby/users` | `protect` | `getNearbyUsers` | |
| GET | `/neighbors` | `protect` | `getNeighbors` | Home-location-based; per source comment, explicitly excludes follows — this is Connect's "Near me," distinct from the follow graph in `follow.md` |
| GET | `/places` | `protect` | `getPlaces` | |
| GET | `/places/:lga/stats` | `protect` | `getPlaceStats` | |

## Known issues found while building this registry

- No `protectAny` usage anywhere in this file — consistent with the `_auth-middleware-split.md`
  finding (`geo` is one of the 27 Bearer-only modules).
- `previewLocation` and `getCommunityPickerOptionsPublic`/`getNigeriaPostalReference`/
  `getLgaCentroid`/`reverseGeocode` being public makes sense given they're used pre-signup during
  onboarding (community picker, location preview) — not flagged as a concern.
- Account deletion (`/sovereignty/delete-account`) living under `/geo` rather than `/auth` or
  `/identity` is a naming surprise worth knowing for the frontend route/feature mapping step — it's
  not where a developer would instinctively look first.
