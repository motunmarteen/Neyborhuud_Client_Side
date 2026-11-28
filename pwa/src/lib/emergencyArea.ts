/**
 * Is an emergency post in my area? (owner 2026-11-27, live Sentinel test)
 * The server tells every open app about every emergency post in Nigeria so feeds refresh. Only
 * people in the same LGA (or the same state, when the post has no LGA) should get the loud toast.
 */

type Area = { lga?: string | null; state?: string | null };
type Me = { lga?: string | null; state?: string | null; location?: Area | null } | null | undefined;

export function normalizeArea(s: string | null | undefined): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\b(local government area|local government|lga|state)\b/g, '')
    .replace(/[^a-z]/g, '');
}

export function isInMyArea(post: Area | null | undefined, me: Me): boolean {
  if (!post || !me) return false;
  const myLga = normalizeArea(me.location?.lga ?? me.lga);
  const myState = normalizeArea(me.location?.state ?? me.state);
  const lga = normalizeArea(post.lga);
  const state = normalizeArea(post.state);
  if (lga) return !!myLga && lga === myLga && (!state || !myState || state === myState);
  if (state) return !!myState && state === myState;
  return false;
}

/** The signed-in user saved by the app (read at the moment an event arrives). */
export function savedUser(): Me {
  try {
    const raw = localStorage.getItem('neyborhuud_user');
    return raw ? (JSON.parse(raw) as Me) : null;
  } catch {
    return null;
  }
}
