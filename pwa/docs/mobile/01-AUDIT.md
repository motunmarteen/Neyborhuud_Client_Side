# NeyborHuud — Mobile (Capacitor) Migration Audit

**Phase 1 deliverable · prepared 2026-06-06 · scope decided: static-export build path, Android-first, iOS deferred.**

This audit is grounded in the actual source tree, not a generic template. Every claim below cites a file I read. Where I could not verify something on this machine, I say so explicitly rather than assume.

---

## 0. Environment reality check (blocking facts)

These are hard constraints discovered during the audit. They shape the entire plan and cannot be engineered away from this machine.

| Fact | Evidence | Consequence |
|---|---|---|
| Host OS is Windows 11 | environment | **iOS cannot be built/tested here.** iOS requires macOS + Xcode. iOS = scaffold + docs only, deferred per your decision. |
| No JDK on PATH | `java` → "command not found" | **Android cannot be built here yet.** Android Studio (bundles JDK 17 + SDK) must be installed first. |
| No Android SDK | `ANDROID_HOME` empty, `%LOCALAPPDATA%\Android\Sdk` absent | Same as above. `npx cap run android` / Gradle will fail until installed. |
| No Gradle on PATH | `gradle` not found | Will be provided by the Gradle wrapper Capacitor generates, but still needs a JDK. |
| No devices/emulators attached | environment | "Exhaustive device QA across phones/tablets/iPhones/iPads, slow networks, low battery" cannot be executed by me. I produce test **plans + automated checks**; device runs are yours or CI's. |

**Bottom line:** I can write all integration code, configs, and the Android project, and run web-level verification (typecheck, build, the export). I **cannot** truthfully report "Android build succeeds" or "iOS build succeeds" until the toolchain exists and a build is actually run. I will not fabricate those results.

---

## 1. Architecture as it actually exists

**Frontend (`NeyborHuud-PWA`)**
- Next.js **16.1.1**, React **19.2.3**, TypeScript 5, Tailwind v4. (`package.json`)
- App Router with two route groups: `(app)` (authed shell) and `(marketing)` (auth/onboarding). (`src/app`)
- **97 `page.tsx` routes; 94 are client components** — the app is overwhelmingly client-rendered. This is the single best fact for Capacitor: a static export will preserve almost all behavior. (`grep` counts)
- **PWA** via `next-pwa` v5.6 with a custom service worker (`service_worker/`, `next.config.ts`).
- **Build output is `output: 'standalone'`** — a Node server, NOT static files. (`next.config.ts:50`)
- Three **server-side API routes** that act as proxies: `/api/geocode/search`, `/api/geocode/reverse`, `/api/health`. These call Nominatim server-side to dodge CORS. (`src/app/(app)/api/geocode/reverse/route.ts`)
- 30 service modules, ~55 hooks, ~90 lib modules. Real, mature app.

**Backend (`NeyborHuud-ServerSide`)**
- Node + Express + TypeScript, modular (`src/modules`, `src/services`, `src/models`), MongoDB.
- API base contract: all calls go through `https://api.neyborhuud.com/api/v1`. (`api-client.ts:346`)
- Socket.IO on the same host (chat, marketplace sockets, calls). (`api-client.ts:363`)

**Auth**
- **Bearer-token in `localStorage`** (`neyborhuud_access_token`, `neyborhuud_refresh_token`). (`api-client.ts:129-160`, `authSession.ts:74`)
- Axios request interceptor attaches `Authorization: Bearer`; response interceptor force-logs-out on genuine 401 session death and redirects to `/login`. (`api-client.ts:38-123`)
- Session restore validates the stored token against `/profile/me`. (`authSession.ts:156`)
- **This is the right model for Capacitor.** Cookie/httpOnly auth is what usually breaks in WebViews; bearer-in-storage survives restarts cleanly. The only upgrade needed is moving the token to native secure storage (see §4).

---

## 2. Native-relevant features inventory (what's in the code today)

| Feature | Current implementation | File(s) |
|---|---|---|
| **Push notifications** | Web Push (VAPID), `pushManager.subscribe`, synced to `/mobile/push/subscribe` | `hooks/usePushNotifications.ts` |
| **Geolocation** | `navigator.geolocation` getCurrentPosition / watchPosition | `services/geo.service.ts:124-164`, `hooks/useGeolocation.ts` |
| **Live location / trips** | Polling + `/safety/trips/:id/location` + offline queue | `hooks/useTripMonitor.ts`, `useLiveTrackingPage.ts`, `useOfflineQueue.ts` |
| **Camera / media capture** | `getUserMedia` + `<input type=file>` across 9+ components | `CreatePostModal.tsx`, `VoiceRecorder.tsx`, `ProductForm.tsx`, `CallProvider.tsx`, … |
| **Media upload** | Axios multipart `uploadFile`/`uploadFiles` with progress | `api-client.ts:230-342` |
| **WebRTC calls** | `CallProvider`, getUserMedia, TURN/ICE (recent commits) | `components/calls/CallProvider.tsx`, `services/call.service.ts` |
| **Realtime** | Socket.IO client | `lib/socket.ts`, `useMarketplaceSocket.ts` |
| **Sharing** | `navigator.share` / `window.open` | `ShareModal.tsx`, `EventShareSheet.tsx`, `MarketplaceShareSheet.tsx` |
| **Offline** | localStorage queue (safety trips only) + SW caching | `useOfflineQueue.ts`, `service_worker/` |
| **Install prompt** | `beforeinstallprompt` PWA flow | `hooks/usePwaInstall.ts`, `lib/pwa-install.ts` |
| **Maps** | Leaflet + react-leaflet + MapLibre GL | `package.json`, `lib/map-style.ts` |
| **Deep linking** | **None.** No `App.addListener('appUrlOpen')`, no scheme/intent handling | (absent — `grep` found nothing) |
| **Biometric auth** | **None** | (absent) |
| **Secure token storage** | **None** — plain localStorage | `api-client.ts:133` |
| **Network monitoring** | `navigator.onLine` + `online` event only | `useOfflineQueue.ts:139` |
| **E2EE** | Service present | `services/e2ee.service.ts` |

---

## 3. The core conflict that must be solved first

Capacitor packages a **static folder of files** (`webDir`) into the native app and serves it from `capacitor://localhost` (Android) / `ionic://` scheme. It cannot run a Next.js `standalone` Node server.

Your app currently:
1. Builds to `output: 'standalone'` (server) — **incompatible** with `webDir`.
2. Has 3 server API routes (`/api/geocode/*`, `/api/health`) — **these vanish in a static export** because there's no server to run them.
3. Uses `next-pwa` service worker — **conflicts** with Capacitor's WebView scheme and is redundant on native (Capacitor handles offline differently).

### Resolution (your chosen path — "Static export")
- Introduce a **build-mode switch** (`NEXT_PUBLIC_CAP=1`) in `next.config.ts`: when set, `output: 'export'`, disable `next-pwa`, and skip the `redirects()` (not supported by export — must become client redirects). The **web PWA build stays byte-for-byte unchanged** when the flag is off.
- **Move the 3 geocode proxy routes to the Express backend** (`NeyborHuud-ServerSide`) as e.g. `GET /api/v1/geo/nominatim/reverse` and `…/search`, and repoint `nominatimClient.ts` / `lib/reverseGeocode.ts` at them. `/api/health` is dev-only and can be dropped from the native build.
- Server components that read `cookies()`/`headers()` at request time would break under export — but the audit found the authed app is client-rendered, so this should be limited. **Risk item: must be verified by actually running `next build` with the flag** (Phase 2 gate).

---

## 4. Security audit (token + data handling)

| Finding | Severity | Detail | Recommendation |
|---|---|---|---|
| Token in `localStorage` | High (mobile) | `api-client.ts:133`, `authSession.ts:74` | Move to Capacitor secure storage (Android Keystore / iOS Keychain) via `@capacitor/preferences` backed by EncryptedSharedPreferences, or `capacitor-secure-storage-plugin`. Keep a thin adapter so web still uses localStorage. |
| No biometric gate | Medium | none | Optional: `@aparajita/capacitor-biometric-auth` to gate app open / re-auth. Store-friendly, expected for a safety app. |
| Refresh token same exposure | High | `authSession.ts:74` | Same secure-storage move. |
| Geocode proxy has no rate limit / key | Low | `api/geocode/reverse/route.ts` | When moved to backend, apply existing rate-limit middleware. |
| `remotePatterns: hostname '**'` | Low | `next.config.ts:20` | Acceptable for now (user-generated media from many CDNs); revisit allowlist before store submission. |
| WebView config | Medium | n/a yet | Android: disable `allowFileAccessFromFileURLs`, set `androidScheme: 'https'`, restrict `allowNavigation` to api host. |

The auth flow itself (interceptors, forced logout on dead session, safe-redirect parsing in `parseSafeNextPath`) is **well built** and needs no logic changes — only the storage backend changes.

---

## 5. What survives, what changes (summary — full matrix in 02-MIGRATION-PLAN.md)

- **Survives unchanged:** all UI, routing, React Query data layer, services, hooks logic, axios client logic, Socket.IO, maps, the entire `(app)` shell. This is ~95% of the code.
- **Adapt:** `next.config.ts` (build switch), token storage adapter, network detection (`navigator.onLine` → `@capacitor/network`), share (`navigator.share` → `@capacitor/share` with web fallback), push (Web Push → `@capacitor/push-notifications` + FCM with web fallback).
- **Move to backend:** 3 geocode/health API routes.
- **Build new:** deep linking (App Links / Universal Links + `appUrlOpen` router bridge), native splash/icons, secure storage, status-bar/safe-area handling, app-state listeners (background/foreground for socket + session revalidation).

---

## 6. Open questions captured (no assumptions made)
1. App IDs: proposed `com.neyborhuud.app` (Android `applicationId` / iOS bundle id) — needs your confirmation, must match store registrations.
2. FCM project: does a Firebase project exist for NeyborHuud, or do we create one? Push on native **requires** it.
3. Universal Links domain: `app.neyborhuud.com` assumed for `assetlinks.json` / AASA — confirm.
4. Does the backend already expose an FCM-capable push endpoint, or only Web Push (`/mobile/push/subscribe`)? Determines backend work.

These are tracked in the migration plan as gates, not blockers to Phase 2 scaffolding.
