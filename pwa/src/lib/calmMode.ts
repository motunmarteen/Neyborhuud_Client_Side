/**
 * Calm mode (tracker F-11): one switch for "less motion, less data".
 *
 * On when any of these is true:
 *   - the phone asks for reduced motion (prefers-reduced-motion)
 *   - the phone's Data Saver is on (navigator.connection.saveData)
 *   - the person turned on "Save data" in Settings (settings.accessibility.liteMode)
 *
 * It sets <html data-calm>, which globals.css uses to stop animations and transitions
 * (loading spinners keep turning), and JS-driven motion (framer-motion, photo sliders,
 * videos) checks isCalm(). The same early script also restores the chosen text size.
 */

const USER_KEY = 'neyborhuud_user';
// Own keys, so a refreshed user record can never switch these off by accident.
const SAVE_DATA_KEY = 'neyborhuud_save_data';
const TEXT_SIZE_KEY = 'neyborhuud_text_size';
export const CALM_EVENT = 'nh-calm-change';

type StoredAccessibility = { liteMode?: boolean; textSize?: 'small' | 'medium' | 'large' };

function storedAccessibility(): StoredAccessibility {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const fromUser: StoredAccessibility = (raw ? JSON.parse(raw)?.settings?.accessibility : null) ?? {};
    const saveData = localStorage.getItem(SAVE_DATA_KEY);
    const textSize = localStorage.getItem(TEXT_SIZE_KEY) as StoredAccessibility['textSize'] | null;
    return {
      liteMode: saveData != null ? saveData === '1' : fromUser.liteMode,
      textSize: textSize ?? fromUser.textSize,
    };
  } catch {
    return {};
  }
}

/** The Save data setting (F-11). Remembered on this phone and applied at once. */
export function setSaveData(enabled: boolean) {
  try {
    localStorage.setItem(SAVE_DATA_KEY, enabled ? '1' : '0');
  } catch {
    /* private mode: still applies for this visit via the user record */
  }
  applyCalm();
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function dataSaverOn(): boolean {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
}

/**
 * Battery (owner, 2026-10-15: "identify users on battery save or data save"). Browsers do not
 * tell a web page whether battery-saver mode is on; Android Chrome does tell the level and
 * whether it is charging, so below 20% and not charging counts as saving battery.
 * iPhone Safari gives nothing, so there it never triggers.
 */
let batteryLow = false;
let batteryWatched = false;
const LOW_BATTERY = 0.2;

export function lowBatteryOn(): boolean {
  return batteryLow;
}

function watchBattery() {
  if (batteryWatched || typeof navigator === 'undefined') return;
  batteryWatched = true;
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<EventTarget & { level: number; charging: boolean }>;
  };
  if (!nav.getBattery) return;
  void nav
    .getBattery()
    .then((b) => {
      const check = () => {
        const low = b.level < LOW_BATTERY && !b.charging;
        if (low !== batteryLow) {
          batteryLow = low;
          applyCalm();
        }
      };
      check();
      b.addEventListener('levelchange', check);
      b.addEventListener('chargingchange', check);
    })
    .catch(() => undefined);
}

export function isCalm(): boolean {
  if (typeof window === 'undefined') return false;
  watchBattery();
  return prefersReducedMotion() || dataSaverOn() || batteryLow || !!storedAccessibility().liteMode;
}

/** Re-read every source and update <html data-calm>; tell listeners. */
export function applyCalm(): boolean {
  const calm = isCalm();
  if (typeof document !== 'undefined') {
    document.documentElement.toggleAttribute('data-calm', calm);
    window.dispatchEvent(new CustomEvent(CALM_EVENT, { detail: calm }));
  }
  return calm;
}

/**
 * Text size from Settings, as <html data-text-size> so every rem-sized thing follows.
 * (An attribute, not a class: React resets <html className> when the page starts.)
 */
export function applyTextSize(size: 'small' | 'medium' | 'large') {
  if (typeof document === 'undefined') return;
  try {
    localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    /* ignore */
  }
  if (size === 'medium') document.documentElement.removeAttribute('data-text-size');
  else document.documentElement.setAttribute('data-text-size', size);
}

/**
 * Runs in <head> before the first paint, so a calm or large-text page never flashes the
 * default first. Kept in sync with isCalm() / applyTextSize() above.
 */
export const CALM_BOOT_SCRIPT = `(function(){try{var a={};try{var r=localStorage.getItem('${USER_KEY}');a=(r&&JSON.parse(r).settings&&JSON.parse(r).settings.accessibility)||{};}catch(e){}try{var sd=localStorage.getItem('${SAVE_DATA_KEY}');if(sd!==null){a.liteMode=sd==='1';}var ts=localStorage.getItem('${TEXT_SIZE_KEY}');if(ts){a.textSize=ts;}}catch(e){}var m=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var s=navigator.connection&&navigator.connection.saveData;if(m||s||a.liteMode){document.documentElement.setAttribute('data-calm','');}if(a.textSize==='small'||a.textSize==='large'){document.documentElement.setAttribute('data-text-size',a.textSize);}}catch(e){}})();`;

/** What this phone remembers for Settings to show (undefined = never set here). */
export function savedAccessibility(): StoredAccessibility {
  if (typeof window === 'undefined') return {};
  return storedAccessibility();
}
