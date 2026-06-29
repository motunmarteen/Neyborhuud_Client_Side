# NeyborHuud — Mobile Migration Plan & Feature Matrix

**Phase 1 deliverable · companion to 01-AUDIT.md.** Categorizes every feature and lays out gated phases. Nothing here is installed yet — this is the plan you approve before Phase 2.

---

## A. Feature categorization

Legend: **WC** = Web Compatible (works in WebView as-is) · **NA** = Needs Adaptation (small code change + web fallback) · **NP** = Requires Native Plugin · **ND** = Requires Native Development (new code/native project config)

| Feature | Category | Plugin / Action | Why |
|---|---|---|---|
| UI / routing / React Query / services | **WC** | none | Client-rendered; runs identically in WebView |
| Maps (Leaflet/MapLibre) | **WC** | none | Pure JS/canvas; works in WebView |
| Media upload (axios multipart) | **WC** | none | FormData works in WebView |
| Socket.IO realtime | **WC** | + app-state reconnect | Works; add foreground reconnect (ND, small) |
| WebRTC calls | **NA** | mic/cam native perms | getUserMedia needs native permission wiring |
| Camera / photo / video capture | **NP** | `@capacitor/camera` (+ keep file input fallback) | Native picker + permissions; better UX than getUserMedia |
| File picker | **NP** | `@capawesome/capacitor-file-picker` or keep `<input file>` | `<input file>` works in WebView; native picker is nicer |
| Geolocation (foreground) | **NP** | `@capacitor/geolocation` | Native permission model; `navigator.geolocation` is unreliable in WebView |
| Background location (trips/kidnapping) | **ND/NP** | `@capacitor/background-runner` or community bg-geolocation | Safety features need location while backgrounded |
| Push notifications | **NP** | `@capacitor/push-notifications` + FCM | Web Push doesn't work on iOS WebView; unreliable on Android |
| Local notifications | **NP** | `@capacitor/local-notifications` | SOS/trip alerts, foreground display |
| Deep / universal links | **ND** | `@capacitor/app` appUrlOpen + App Links/AASA | None exists today; needed for invites, notification taps |
| Native share | **NA** | `@capacitor/share` (web fallback to navigator.share) | Native share sheet |
| Network monitoring | **NA** | `@capacitor/network` (fallback navigator.onLine) | Reliable connectivity events |
| Secure token storage | **NP** | secure storage plugin + adapter | Move token off localStorage |
| Biometric auth (optional) | **NP** | `@aparajita/capacitor-biometric-auth` | App-lock for a safety app |
| Device info | **NP** | `@capacitor/device` | Push targeting, analytics, support |
| Clipboard | **NA** | `@capacitor/clipboard` (fallback) | Copy invite/links |
| Status bar / safe areas | **ND** | `@capacitor/status-bar` + CSS env() | Native-feel; notch handling |
| Splash screen | **NP** | `@capacitor/splash-screen` | Launch experience |
| App icons | **ND** | `@capacitor/assets` generate | Store requirement |
| Build target (standalone→export) | **ND** | `next.config.ts` switch | Core conflict (Audit §3) |
| Geocode proxy routes | **ND** | move to Express backend | No server in static export |
| `next-pwa` SW | **ND** | disable for native build | Conflicts with Capacitor scheme |
| Offline queue | **WC** | extend later | Already localStorage-based |

---

## B. Phased execution (each phase gated for your review)

### Phase 1 — Audit + Plan ✅ (this document + 01-AUDIT.md)
**STOP. Your review.**

### Phase 2 — Build foundation (no native tooling needed to write; build verifiable on web)
1. Add `NEXT_PUBLIC_CAP` switch to `next.config.ts` (export mode + disable next-pwa + drop incompatible redirects → client-side).
2. Convert the 3 redirects + 3 server geocode routes:
   - Move `/api/geocode/{search,reverse}` to backend `GET /api/v1/geo/nominatim/{search,reverse}`; repoint `nominatimClient.ts` & `lib/reverseGeocode.ts`.
   - `/messages` redirects → client-side `redirect()` in a small route or middleware-free shim.
3. Run `NEXT_PUBLIC_CAP=1 next build` and confirm `out/` is produced and pages render. **Gate: build must actually succeed — reported honestly.**
**STOP. Your review.**

### Phase 3 — Capacitor core + Android project
1. `npm i @capacitor/core @capacitor/cli @capacitor/android`; `npx cap init` with confirmed app id.
2. `capacitor.config.ts`: `webDir: 'out'`, `androidScheme: 'https'`, server allowNavigation = api host, splash config.
3. `npx cap add android`. Configure `AndroidManifest.xml` permissions (location, camera, mic, notifications, internet).
4. App icons + splash via `@capacitor/assets` from existing `public/icon-512.png`.
5. **Gate: requires Android Studio/JDK/SDK installed by you.** Until then I deliver the project + a build runbook; I cannot run Gradle.
**STOP. Your review.**

### Phase 4 — Core native plugins + adapters
Secure storage adapter, `@capacitor/network`, `@capacitor/share`, `@capacitor/status-bar` + safe-area CSS, `@capacitor/app` (back button + foreground/background listeners → socket reconnect + session revalidate), `@capacitor/device`, splash hide on ready.
**STOP. Your review.**

### Phase 5 — Geolocation + camera + media (permission-gated UX)
`@capacitor/geolocation` behind the existing `geo.service` interface (web fallback kept), `@capacitor/camera` behind a capture abstraction used by CreatePostModal et al. Runtime permission prompts with rationale screens.
**STOP. Your review.**

### Phase 6 — Push (FCM) + deep linking
FCM project wiring, `@capacitor/push-notifications`, backend device-token endpoint (coordinate with backend), notification tap → deep link router, Android App Links (`assetlinks.json`) + iOS AASA (config only). Web Push path preserved for the PWA.
**STOP. Your review.**

### Phase 7 — Mobile UX polish + performance
Safe-area-aware nav, native gestures already partially present (`SwipeBackContext`), bundle/perf pass scoped to the export build, 60fps audit of feed.
**STOP. Your review.**

### Phase 8 — QA + store readiness (docs + automatable checks only here)
Test matrix, store listing copy, privacy/permission strings, screenshot checklist, signing runbook. **Device QA and submission are yours.**

---

## C. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Static export breaks a server-rendered page | Medium | Phase 2 build gate catches it; convert offending page to client or generateStaticParams |
| Apple "4.2 just a website" rejection | Medium | We are NOT using remote-URL shell; native plugins (push, geo, camera, biometrics, share) give genuine native capability |
| Background location battery/policy rejection | Medium | Justify with safety use case; request only when trip active; foreground-service notification on Android |
| FCM project doesn't exist | Unknown | Open question #2 — blocks Phase 6 only |
| No Mac for iOS | Certain | iOS deferred per your decision; config + runbook delivered |
| Toolchain absent for Android build | Certain (now) | You install Android Studio; runbook provided in Phase 3 |

---

## D. What I will NOT do (honesty commitments)
- Will not report a build as passing unless I actually ran it and saw it pass.
- Will not claim device QA I cannot perform.
- Will not silently break the existing web PWA — native changes go behind the `NEXT_PUBLIC_CAP` flag.
- Will not submit to stores or touch your signing keys / developer accounts.
