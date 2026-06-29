import type { CapacitorConfig } from '@capacitor/cli';

/**
 * NeyborHuud Capacitor configuration.
 *
 * Web content: the static export produced by `pnpm build:cap` (./out) is
 * bundled into the native app — a real offline-capable app, not a remote-URL
 * shell. API/socket traffic still goes to api.neyborhuud.com at runtime.
 *
 * androidScheme: 'https' makes the WebView origin `https://localhost`, which is
 * a secure context — required for Geolocation, camera (getUserMedia), and other
 * powerful web APIs the app relies on.
 */
const config: CapacitorConfig = {
  appId: 'com.neyborhuud.app',
  appName: 'NeyborHuud',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // The bundled app runs from https://localhost. Allow the WebView to talk to
    // the backend API/socket host. Do NOT add '*' here — keep navigation locked
    // to known origins so the WebView cannot be redirected to arbitrary sites.
    allowNavigation: [
      'api.neyborhuud.com',
      'app.neyborhuud.com',
    ],
  },
  android: {
    // Mixed content stays off; all backend traffic must be https in production.
    allowMixedContent: false,
  },
  plugins: {
    // Splash screen is controlled in code (hidden once the app shell is ready)
    // rather than on a fixed timer; see Phase 4. Configured here so the native
    // launch screen does not flash white before the WebView paints.
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#060908',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
