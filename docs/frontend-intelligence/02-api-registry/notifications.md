# API Registry — Notifications

> Mount: `app.use("/api/v1/notifications", notificationRoutes)` — `app.ts:321`
> Source: `NeyborHuud-ServerSide/src/modules/notifications/notification.routes.ts`
>
> **Total: 11 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`).

## Inbox
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/` | `listNotifications` | |
| GET | `/unread-count` | `getUnreadCount` | |
| PATCH | `/read-all` | `markAllAsRead` | |
| POST | `/mark-all-read` | `markAllAsRead` | Alias of the above — same handler, different verb/path, likely a client-migration leftover |
| PATCH | `/:id/read` | `markAsRead` | |

## Preferences (labeled "Phase 26 Polish" in source)
| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/preferences` | `getPreferences` | |
| PATCH | `/preferences` | `updatePreferences` | |
| GET | `/settings` | `getPreferences` | Alias of `/preferences` — same handler |
| PUT | `/settings` | `updatePreferences` | Alias of `/preferences` — same handler |

## Debug
| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/test/push` | `testPush` | Labeled "Debug Routes" in source — sends a real test push notification to the caller |
| POST | `/test/sms` | `testSMS` | Same — real test SMS |

## Known issues found while building this registry

- **Two full alias pairs in an 11-route module**: `/read-all` (PATCH) duplicates `/mark-all-read`
  (POST), and `/preferences` duplicates `/settings` under different verbs. Neither is documented in
  source as intentional (unlike the marketplace/content alias pairs, which have explicit comments).
  Worth asking during the Frontend Contract step which pair the frontend actually calls, so the new
  frontend doesn't accidentally standardize on the dead alias.
- **`/test/push` and `/test/sms` are live, `protect`-gated debug routes left mounted in
  production** — they genuinely send a push notification / SMS to whichever authenticated user
  calls them. Not a frontend concern directly, but worth flagging: these should probably not be
  reachable outside a debug/admin build, and the new frontend should not link to them from any
  user-facing settings screen.
