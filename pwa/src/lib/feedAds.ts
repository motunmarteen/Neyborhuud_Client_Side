/**
 * Where sponsored cards go in the feed (owner, 2026-10-15, "like X").
 *
 * - First ad after the 3rd item, then one every 6 items.
 * - Never right before or right after a safety / emergency post: the slot moves down.
 * - Each ad is shown once per feed load; hidden ads are left out.
 */

export const FIRST_AD_AFTER = 3;
export const AD_EVERY = 6;

/** True for items an ad must not sit next to (safety alerts, emergencies). */
export type IsSensitive = (index: number) => boolean;

/**
 * Returns timeline index → ad: the ad is drawn just after that item.
 * `count` is the number of feed items currently loaded.
 */
export function placeFeedAds<A>(count: number, ads: A[], isSensitive: IsSensitive): Map<number, A> {
  const slots = new Map<number, A>();
  let next = 0;
  let at = FIRST_AD_AFTER - 1;
  while (next < ads.length && at < count) {
    let i = at;
    // Move down while the item before or after the slot is sensitive.
    while (i < count && (isSensitive(i) || (i + 1 < count && isSensitive(i + 1)))) i++;
    // Need a real item after the ad (no ad as the very last thing loaded).
    if (i >= count - 1) break;
    slots.set(i, ads[next++]);
    at = i + AD_EVERY;
  }
  return slots;
}

const HIDDEN_KEY = 'nh_hidden_ads';

/** Ads this person hid on this device (a convenience; the server never needs it). */
export function readHiddenAds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(HIDDEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(-200) : []);
  } catch {
    return new Set();
  }
}

export function saveHiddenAd(id: string): void {
  try {
    const set = readHiddenAds();
    set.add(id);
    window.localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set].slice(-200)));
  } catch {
    /* storage blocked: hidden for this visit only */
  }
}
