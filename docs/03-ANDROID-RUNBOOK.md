# NeyborHuud 2.0 Android Build & Release Signing Runbook

This guide documents the production build, signing, and Google Play Store release process for the **NeyborHuud Android App** (`com.neyborhuud.app`) powered by Capacitor 8.

---

## 1. Architecture Overview

- **App ID:** `com.neyborhuud.app`
- **Native Container:** Capacitor Android 8.4 (`@capacitor/android`)
- **Web App:** Next.js 16 Static Export bundled locally into `out/`
- **Origin Security:** Runs from `https://localhost` (WebView AndroidScheme: `https`), granting secure context access to HTML5 Geolocation, Camera (`getUserMedia`), and Service Workers.
- **Backend API:** Connects to sovereign NeyborHuud backend API and WebSocket servers (`api.neyborhuud.com`).

---

## 2. Prerequisites

1. **Node.js:** v20+ / v22+
2. **Package Manager:** `pnpm` (or `npm`)
3. **Android Studio:** Ladybug / Hedgehog or newer with:
   - Android SDK Build-Tools 35.0.0+
   - Android SDK Platform 34 or 35 (API 34/35)
   - JDK 17 or JDK 21 (configured as `JAVA_HOME`)

---

## 3. Build & Sync Steps

### Step 1: Build the Static Web Bundle
From `NeyborHuud-PWA/pwa`:
```bash
# Export static production bundle into ./out
npm run build:cap
```

### Step 2: Sync Web Assets to Android Project
```bash
# Copy bundle and update plugins
npx cap sync android
```

---

## 4. Production Keystore Generation

To publish on the Google Play Store, generate a cryptographically secure 2048-bit RSA upload key:

```bash
keytool -genkeypair -v \
  -keystore neyborhuud-release.keystore \
  -alias neyborhuud \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=NeyborHuud Release, OU=Mobile, O=NeyborHuud Technologies, L=Lagos, ST=Lagos, C=NG"
```

> **IMPORTANT:** Back up `neyborhuud-release.keystore` and its password securely. If this key is lost, Google Play will reject app updates.

---

## 5. Gradle Release Signing Configuration

In `android/app/build.gradle`:

```groovy
android {
    ...
    defaultConfig {
        applicationId "com.neyborhuud.app"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "2.0.0"
    }

    signingConfigs {
        release {
            storeFile file("neyborhuud-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS") ?: "neyborhuud"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 6. Building the Release Android App Bundle (`.aab`)

Google Play requires the Android App Bundle format (`.aab`) for dynamic feature delivery:

```bash
cd android
./gradlew bundleRelease
```

The signed artifact will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 7. Native Permissions Matrix

The NeyborHuud app requires the following Android permissions declared in `AndroidManifest.xml`:

| Permission | Purpose |
|---|---|
| `ACCESS_FINE_LOCATION` | NIPOST NDAPS building geofencing & street radar |
| `ACCESS_COARSE_LOCATION` | Differential privacy location approximation |
| `CAMERA` | Profile photos, payment proof upload, incident reports |
| `POST_NOTIFICATIONS` | Instant Huud SOS alerts & deal chat updates |
| `VIBRATE` / `HAPTIC_FEEDBACK` | Emergency SOS panic trigger confirmation |
| `INTERNET` / `ACCESS_NETWORK_STATE` | Real-time WebSocket signaling & API traffic |
