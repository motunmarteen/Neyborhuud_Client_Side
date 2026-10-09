# API Registry — Profile

> Mount: `app.use("/api/v1/profile", profileRoutes)` — `app.ts:345`
> Source: `NeyborHuud-ServerSide/src/modules/profile/profile.routes.ts`
>
> **Total: 11 routes.**
>
> **Correction to `_auth-middleware-split.md`'s per-file granularity**: that file lists `profile` as
> one of the 6 "uses `protectAny`" modules — true at the file level (it does use `protectAny`
> somewhere), but **not uniformly**. Reading this file directly shows a real split *within* the
> module itself: identity/settings-shaped routes (`/me`, `/username`, `/me/username-timeline`) use
> `protectAny` (with a source comment: *"same Bearer resolution as feed/auth (Better Auth + DB
> session + legacy JWT)"* — actually a three-way fallback, not just two), while file-upload routes
> (`/avatar`, `/cover`) and `/settings` use plain `protect`. Both work fine for the frontend's
> Bearer-only calls (per `_auth-middleware-split.md`'s general conclusion), so this is a
> documentation-precision correction, not a new bug — but worth knowing precisely which routes have
> the wider fallback if the frontend ever moves toward cookie-based sessions.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/me` | `protectAny` | `getCurrentUserProfile` | |
| PATCH | `/me` | `protectAny`, validated | `updateMyProfile` | |
| PUT | `/me` | `protectAny`, validated | `updateMyProfile` | Alias of PATCH — same handler |
| PATCH | `/username` | `protectAny`, validated | `changeUsername` | |
| GET | `/me/username-timeline` | `protectAny` | `getMyUsernameTimeline` | |
| GET | `/users/:userId/username-timeline` | public | `getPublicUsernameTimeline` | |
| POST | `/avatar` | `protect`, multer (single, 5MB, image-only) | `uploadProfilePicture` | |
| DELETE | `/avatar` | `protect` | `deleteProfilePicture` | |
| POST | `/cover` | `protect`, multer (single, 10MB, image-only) | `uploadCoverPhoto` | |
| DELETE | `/cover` | `protect` | `deleteCoverPhoto` | |
| PATCH | `/settings` | `protect` | `updateSettings` | |

## Known issues found while building this registry

- **Username changes have a full timeline/history feature** (`/me/username-timeline`,
  `/users/:userId/username-timeline`) — worth knowing for a profile page design that might want to
  show "formerly known as" history, and confirms username changes are tracked events, not just an
  overwritten field.
- `PATCH /me` and `PUT /me` being true aliases (identical handler) is a minor duplication, same
  pattern as `notifications.md`'s `/preferences`/`/settings` pair — worth standardizing on one verb
  in the new Frontend Contract rather than perpetuating both.
