# API Registry — Mobile / PWA

> Mount: `app.use("/api/v1/mobile", mobileRoutes)` — `app.ts:343`
> Source: `NeyborHuud-ServerSide/src/modules/mobile/mobile.routes.ts`
>
> **Total: 6 routes.** Mixed public/`protect` (Bearer-only — see `_auth-middleware-split.md`).

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/push/subscribe` | `protect` | `subscribeToPush` | |
| POST | `/push/unsubscribe` | `protect` | `unsubscribeFromPush` | |
| POST | `/sync` | `protect` | `syncOfflineActions` | Offline-first sync — relevant to PWA/Capacitor offline behavior noted in Step 1 |
| POST | `/analytics` | `protect` | `logAnalytics` | |
| GET | `/config` | public | `getAppConfig` | Source comment: "Public for PWA manifest-like data" |
| GET | `/config/:key` | public | `getAppConfig` | Same handler, keyed variant |

## Known issues found while building this registry

- **Directly relevant to the Android/iOS app-store end-goal**: this module's push-subscription
  (`/push/subscribe`) is Web Push-shaped (subscribe/unsubscribe endpoints, no APNs/FCM device-token
  language). Native iOS/Android push typically needs device tokens registered through
  APNs/FCM rather than a browser PushSubscription object. Worth flagging now for the later
  architecture step: this endpoint pair may need to change shape (or a parallel endpoint added) once
  native apps exist, rather than assuming the current PWA push flow "just works" on native.
- `/sync` (offline action sync) is a good confirmation of the Step 1-noted PWA offline behavior
  having real backend support, not just client-side caching.
