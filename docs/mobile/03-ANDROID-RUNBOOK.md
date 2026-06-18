# NeyborHuud — Android Build & Run Runbook

**Phase 3 deliverable.** How to build, run, and debug the Android app. Capacitor 8.4.0, target/compile SDK 36, min SDK 24, JDK 21 (Android Studio's bundled `jbr`).

---

## Prerequisites (this machine, verified 2026-06-06)
- Android Studio installed → bundles JDK 21 at `C:\Program Files\Android\Android Studio\jbr`.
- Android SDK at `%LOCALAPPDATA%\Android\Sdk` (platform-tools, platform android-36.1, build-tools 36/37, licenses).
- `android/local.properties` points Gradle at the SDK (git-ignored; recreate if missing — see below).

> `cmdline-tools` is **not** installed. Gradle builds work without it. If a build ever
> complains about a missing SDK component or unaccepted license, install it via
> Android Studio → Settings → Languages & Frameworks → Android SDK → **SDK Tools** tab →
> check **Android SDK Command-line Tools (latest)** → Apply.

---

## One-time / environment

`android/local.properties` (git-ignored) must contain:
```
sdk.dir=C:\\Users\\Hp\\AppData\\Local\\Android\\Sdk
```

Gradle needs `JAVA_HOME`. Either set it once in Windows env vars, or pass it per-command:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

---

## The build cycle (web → native)

The native app bundles the **static export** (`out/`). Any time the web code changes:

```powershell
# 1. Rebuild the static export (Phase 2 pipeline — stops dev server conflicts itself)
pnpm build:cap          # produces ./out

# 2. Copy web assets + config into the native project
npx cap sync android    # copies out/ -> android/app/src/main/assets/public

# 3a. Build a debug APK from the CLI
cd android
.\gradlew.bat assembleDebug --no-daemon
#    -> android/app/build/outputs/apk/debug/app-debug.apk

# 3b. …or open in Android Studio to run on a device/emulator
npx cap open android
```

`pnpm build:cap` + `npx cap sync android` together are the "deploy web changes to the
app" step. `cap sync` also reinstalls native plugins, so run it after adding any
`@capacitor/*` plugin.

---

## Running on a device / emulator

**Emulator:** Android Studio → Device Manager → create a Pixel (API 34+) → Run ▶.

**Physical device:** enable USB debugging (Settings → About → tap Build Number 7×, then
Developer Options → USB debugging), plug in, then:
```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices      # confirm device shows
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

**Live reload against a dev server** (optional, fast iteration): run `pnpm dev`, then
temporarily set `server.url` in `capacitor.config.ts` to your machine's LAN IP
(`http://192.168.x.x:3001`) + `cap sync`. **Revert before any release build** — release
must bundle `out/`, never a dev URL.

---

## Debugging the WebView
- Chrome → `chrome://inspect` → the app's WebView appears → **inspect** for full DevTools
  (console, network, elements) against the running app.
- Native/Gradle logs: `adb logcat` or Android Studio's Logcat (filter by `Capacitor`).

---

## App identity (locked)
| Field | Value |
|---|---|
| applicationId / namespace | `com.neyborhuud.app` |
| appName | NeyborHuud |
| webDir | `out` |
| androidScheme | `https` (WebView origin = `https://localhost`, a secure context) |
| min / target / compile SDK | 24 / 36 / 36 |

## Permissions declared (`AndroidManifest.xml`)
INTERNET, ACCESS_NETWORK_STATE, ACCESS_COARSE/FINE_LOCATION, CAMERA, RECORD_AUDIO,
MODIFY_AUDIO_SETTINGS, READ_MEDIA_IMAGES/VIDEO, READ_EXTERNAL_STORAGE (≤API 32),
POST_NOTIFICATIONS, VIBRATE. Camera + GPS features declared `required="false"` so the
app still installs on hardware lacking them (e.g. some tablets). Runtime permission
prompts are wired per-feature in Phase 5 (geo/camera) and Phase 6 (notifications).

---

## Release build (later — needs signing)
Not done yet. Requires a signing keystore + `android/key.properties` (Phase 8). Do **not**
commit the keystore. A debug APK is unsigned-for-store and for testing only.

---

## Troubleshooting
| Symptom | Fix |
|---|---|
| `SDK location not found` | recreate `android/local.properties` (above) |
| `JAVA_HOME is not set` / wrong Java | export `JAVA_HOME` to the `jbr` path above (JDK 21) |
| Build wants a missing SDK pkg/license | install cmdline-tools (top of doc), then `sdkmanager --licenses` |
| White flash on launch | expected until Phase 4 wires SplashScreen.hide() on app-ready |
| Blank screen / assets 404 | re-run `pnpm build:cap && npx cap sync android` (stale `out/`) |
| Geolocation/camera fail silently | Phase 5 adds native plugins + runtime prompts; web APIs need the `https` scheme (already set) |
