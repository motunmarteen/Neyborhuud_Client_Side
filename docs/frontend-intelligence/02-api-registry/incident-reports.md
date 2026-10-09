# API Registry — Incident Reports

> Mount: `app.use("/api/v1/incident-reports", incidentReportRoutes)` — `app.ts:349`
> Source: `NeyborHuud-ServerSide/src/modules/incidentReport/incidentReport.routes.ts`
>
> **Total: 15 routes.** Mixed public/`optionalAuth`/`protect` (Bearer-only — see
> `_auth-middleware-split.md`). Static paths correctly ordered before `/:id` per source comment.
> Distinct from `safety.md`'s emergency/SOS system — this is community incident *reporting*
> (witness/confirm/dispute), not live emergency response.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/my` | `protect` | `getMyReports` | |
| GET | `/stats` | `optionalAuth` | `getIncidentStats` | `?lga=&state=` |
| GET | `/` | `optionalAuth` | `listIncidents` | |
| POST | `/` | `protect`, `requireVerified`, validated | `createIncident` | Source comment: "verified only — false reports cause panic" |
| GET | `/:id` | `optionalAuth` | `getIncident` | |
| PATCH | `/:id` | `protect`, validated | `updateIncident` | |
| DELETE | `/:id` | `protect` | `deleteIncident` | |
| POST | `/:id/interact/:type` | `protect` | `interactWithIncident` | `:type` = witness/confirm/dispute per source comment example |
| GET | `/:id/comments` | `optionalAuth` | `listComments` | |
| POST | `/:id/comments` | `protect`, validated | `addComment` | |
| DELETE | `/comments/:commentId` | `protect` | `deleteComment` | |
| POST | `/:id/updates` | `protect`, validated | `addStatusUpdate` | Source comment: "reporter + admin" |
| POST | `/:id/escalate` | `protect`, validated | `escalateIncident` | |
| POST | `/:id/resolve` | `protect`, validated | `resolveIncident` | |
| PATCH | `/:id/status` | `protect`, validated | `changeIncidentStatus` | |

## Known issues found while building this registry

- **`requireVerified` gating incident creation ("false reports cause panic") is a deliberate,
  well-reasoned anti-abuse decision** worth preserving as-is in the rebuild's UX — e.g. an unverified
  user's incident-report composer should clearly explain why they need to verify first, rather than
  just failing silently or with a generic error.
- The witness/confirm/dispute interaction model (`/:id/interact/:type`) is conceptually similar to
  `trust.md`'s vouch system (community members corroborating something) but implemented completely
  separately — worth noting as a recurring "community corroboration" pattern across the platform
  (vouches, incident witnessing, content endorsement) rather than three unrelated features, useful
  framing for the later design-system step.
- This module and `safety.md` both deal with "something is wrong" reporting but are cleanly
  separated by severity/intent (incident reports = community awareness/civic record; safety/SOS =
  live emergency response) — worth keeping that separation explicit in the frontend IA rather than
  merging them into one "Report" entry point.
