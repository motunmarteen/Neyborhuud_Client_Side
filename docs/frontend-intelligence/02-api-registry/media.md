# API Registry — Media (Generic Upload)

> Mount: `app.use("/api/v1/media", mediaRoutes)` — `app.ts:319`
> Source: `NeyborHuud-ServerSide/src/modules/media/media.routes.ts`
>
> **Total: 2 routes.** Both `protect` (Bearer-only — see `_auth-middleware-split.md`).
>
> **Note**: this module was initially missed in this registry's first pass through the mount list
> — caught and filled in during a final completeness check against `app.ts`'s full 37-mount list,
> per the standing instruction to verify everything directly rather than assume coverage.

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/upload` | `uploadFiles` | Multer, in-memory, up to 10 files, 50MB limit total |
| GET | `/signed-params` | `getSignedParams` | Likely returns signed upload parameters for a direct-to-cloud-storage upload flow (e.g. Cloudinary/S3 presigned params) — not traced into the controller this pass |

## Known issues found while building this registry

- This is a **generic** upload endpoint, distinct from the module-specific multer configs already
  documented elsewhere (`events.md`'s cover image, `jobs.md`'s resume, `profile.md`'s avatar/cover,
  `services.md`'s listing images) — those modules each run their own in-route multer instance rather
  than calling through this shared `/media/upload`. Worth clarifying in the Frontend Contract step
  whether `/media/upload` is meant to be the one general-purpose upload path (e.g. for chat media,
  confirmed separately in `chat.md`'s own `/upload` route) while the others are deliberately
  specialized, or whether this represents duplicated upload-handling logic worth consolidating.
- `getSignedParams` suggests the platform may support (or intend to support) direct client-to-
  storage uploads bypassing the Express server entirely for large files — relevant context for the
  native Android/iOS app work, since a signed-URL direct-upload flow is usually the better pattern
  for mobile apps versus routing large media through the API server.
