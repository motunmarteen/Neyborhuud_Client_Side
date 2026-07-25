/**
 * Local (device-scheduled) notification shim for the native Capacitor build.
 *
 * Mirrors nativeGeolocation.ts's pattern: `@capacitor/local-notifications`
 * is imported dynamically so the web/PWA bundle has zero dependency on it
 * and never loads the native plugin.
 *
 * Why this exists: features like Fake Call schedule a delayed action (e.g.
 * "ring in 30s") using a plain in-page `setTimeout`. That works only while
 * the tab/app stays foregrounded — mobile OSes routinely throttle or fully
 * suspend JS timers the moment the screen locks or the app backgrounds,
 * which is exactly when a feature like Fake Call is most likely to be used
 * (the whole point is to set it and act normal for a moment). A real OS-
 * scheduled local notification fires independent of the page's JS
 * execution state, so it can reliably bring the app back to the foreground
 * (or at minimum alert the user) even after backgrounding.
 */
import { isNativePlatform } from './platform';

type CapLocalNotificationsPlugin = {
  schedule(options: { notifications: ScheduleOptions[] }): Promise<{ notifications: Array<{ id: number }> }>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  requestPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' }>;
  checkPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' }>;
  addListener(
    eventName: 'localNotificationActionPerformed',
    listener: (notification: { notification: { id: number; extra?: Record<string, unknown> } }) => void,
  ): Promise<{ remove: () => void }>;
};

interface ScheduleOptions {
  id: number;
  title: string;
  body: string;
  schedule?: { at: Date };
  sound?: string;
  extra?: Record<string, unknown>;
  channelId?: string;
}

let capPromise: Promise<CapLocalNotificationsPlugin> | null = null;
function loadCapLocalNotifications(): Promise<CapLocalNotificationsPlugin> {
  if (!capPromise) {
    capPromise = import('@capacitor/local-notifications').then(
      (m) => m.LocalNotifications as unknown as CapLocalNotificationsPlugin,
    );
  }
  return capPromise;
}

/** Only usable inside the native Capacitor shell — always false on web/PWA. */
export function canScheduleLocalNotifications(): boolean {
  return isNativePlatform();
}

/**
 * Schedule a local notification to fire at `fireAt`. Returns the id used
 * (needed for cancelLocalNotification), or null if scheduling isn't
 * possible (web build, permission denied, or the plugin call failed) —
 * callers should treat null as "fall back to the in-page timer."
 */
export async function scheduleLocalNotification(params: {
  id: number;
  title: string;
  body: string;
  fireAt: Date;
  extra?: Record<string, unknown>;
}): Promise<number | null> {
  if (!canScheduleLocalNotifications()) return null;
  try {
    const plugin = await loadCapLocalNotifications();
    const perm = await plugin.checkPermissions();
    if (perm.display !== 'granted') {
      const requested = await plugin.requestPermissions();
      if (requested.display !== 'granted') return null;
    }
    await plugin.schedule({
      notifications: [
        {
          id: params.id,
          title: params.title,
          body: params.body,
          schedule: { at: params.fireAt },
          extra: params.extra,
        },
      ],
    });
    return params.id;
  } catch {
    return null;
  }
}

export async function cancelLocalNotification(id: number): Promise<void> {
  if (!canScheduleLocalNotifications()) return;
  try {
    const plugin = await loadCapLocalNotifications();
    await plugin.cancel({ notifications: [{ id }] });
  } catch {
    // best-effort
  }
}

/**
 * Fires `onTapped` when the user taps a scheduled notification whose
 * `extra` matches `matchExtraKey`/`matchExtraValue` — used so a tapped
 * Fake Call notification can bring the app to the ringing screen even if
 * it had been fully backgrounded when the notification fired.
 */
export async function onLocalNotificationTapped(
  matchExtraKey: string,
  onTapped: (extra: Record<string, unknown>) => void,
): Promise<() => void> {
  if (!canScheduleLocalNotifications()) return () => undefined;
  try {
    const plugin = await loadCapLocalNotifications();
    const handle = await plugin.addListener('localNotificationActionPerformed', (event) => {
      const extra = event.notification.extra;
      if (extra && matchExtraKey in extra) onTapped(extra);
    });
    return () => handle.remove();
  } catch {
    return () => undefined;
  }
}
