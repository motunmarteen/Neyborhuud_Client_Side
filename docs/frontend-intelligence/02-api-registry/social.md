# API Registry — Social (legacy path, username lookup only)

> Mount: `app.use("/api/v1/social", socialRoutes)` — `app.ts:341`, imported as
> `import socialRoutes from "./modules/social/chat.routes.js"` with an inline `app.ts` comment:
> `// Legacy path name kept: only mounts the live username-lookup route now`
> Source: `NeyborHuud-ServerSide/src/modules/social/chat.routes.ts`
>
> **⚠️ This is the file named identically to the real chat routes file — see `chat.md`'s header for
> the full naming-trap writeup.** This confirms directly from source what `chat.md` already flagged:
> the file's own top-of-file comment states a full legacy group-chat system (createGroup/joinGroup/
> sendMessage/getMessages, backed by placeholder `ChatGroup`/`GroupMember`/`ChatMessage` models) was
> verified unreachable from the frontend and removed during the "chat-system overhaul (Phase 1)."
> Only one route survives.
>
> **Total: 1 route.**

| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/users/username/:username` | public | `getUserByUsername` |

## Known issues found while building this registry

- Nothing further to find — this is about as minimal and well-documented-by-its-own-comments as a
  legacy leftover file gets. No dead code risk for the frontend (only one real route, already
  accounted for), but the mount path (`/social`) and file path (`modules/social/`) both remain
  namespace traps for anyone searching by name rather than by mount — worth considering renaming
  during a backend cleanup pass, not urgent for the frontend rebuild itself.
