/**
 * Visitors (not signed in) on the map home (owner, 2026-10-17: "let them see the map").
 * A shared link may carry the sharer's invite code (?ref=); it is kept for this visit so
 * "Join free" still credits them.
 */
const REF_KEY = 'nh_visit_ref';

export function rememberRef(ref: string | null) {
  if (!ref) return;
  try {
    sessionStorage.setItem(REF_KEY, ref.slice(0, 40));
  } catch {
    /* private mode */
  }
}

export function signupHref(): string {
  try {
    const ref = sessionStorage.getItem(REF_KEY);
    return ref ? `/signup?ref=${encodeURIComponent(ref)}` : '/signup';
  } catch {
    return '/signup';
  }
}

/** Pages a visitor may open without signing in. */
export const VISITOR_ROUTES = ['/huud'];
