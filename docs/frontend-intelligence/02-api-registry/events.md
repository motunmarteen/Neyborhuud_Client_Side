# API Registry — Events

> Mount: `app.use("/api/v1/events", eventsRoutes)` — `app.ts:333`
> Source: `NeyborHuud-ServerSide/src/modules/events/events.routes.ts`
>
> **Total: 22 routes.** `protect` (Bearer-only — see `_auth-middleware-split.md`) for writes;
> `optionalAuth` (attaches user if present, never rejects) for public/personalizable reads.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/my/attending` | `protect` | `getMyAttending` | |
| GET | `/my/organized` | `protect` | `getMyOrganized` | |
| GET | `/nearby` | `optionalAuth` | `getNearbyEvents` | |
| GET | `/` | `optionalAuth` | `listEvents` | |
| POST | `/` | `protect`, `requireVerified`, optional multer (cover image), validated | `createEvent` | |
| GET | `/:id` | `optionalAuth` | `getEvent` | |
| PUT | `/:id` | `protect`, optional multer, validated | `updateEvent` | |
| DELETE | `/:id` | `protect` | `deleteEvent` | |
| POST/DELETE | `/:id/attend` | `protect` | `attendEvent` / `unattendEvent` | Labeled "legacy binary; kept working" — superseded by tri-state RSVP below |
| POST | `/:id/rsvp` | `protect`, validated | `rsvpToEvent` | Tri-state (going/maybe/not going per Step 1 audit's `RsvpStatus` type) |
| GET | `/:id/rsvp` | `protect` | `getMyRsvp` | |
| POST | `/:id/update` | `protect`, validated | `postEventUpdate` | Organizer broadcast to attendees |
| GET | `/:id/attendees` | `protect` | `getEventAttendees` | |
| GET | `/:id/share` | `optionalAuth` | `getEventShare` | |
| POST | `/:id/share` | `protect` | `shareEvent` | |
| POST | `/:id/cancel` | `protect`, validated | `cancelEvent` | |
| POST | `/:id/boost` | `protect` | `boostEvent` | HuudCoin-paid |
| POST | `/:id/report` | `protect`, validated | `reportEvent` | |
| GET | `/:id/comments` | `optionalAuth` | `listEventComments` | |
| POST | `/:id/comments` | `protect`, validated | `addEventComment` | |
| DELETE | `/comments/:commentId` | `protect` | `deleteEventComment` | |

## Known issues found while building this registry

- None — this file is clean: static routes correctly ordered before `:id`, legacy attend/unattend
  clearly labeled as superseded rather than silently duplicated, no dead imports found.
