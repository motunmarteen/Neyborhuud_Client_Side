/**
 * Static-export support for client-rendered dynamic routes.
 *
 * Under `output: 'export'` (the Capacitor build) Next.js generates one
 * placeholder shell per dynamic segment (param value `__id`). When the SPA
 * navigates to a *real* param (e.g. /profile/jane), the WebView is served that
 * placeholder shell, and Next's `useParams()` returns the literal `"__id"`
 * rather than `"jane"`.
 *
 * `resolveDynamicParam` fixes that by reading the real value from the live URL
 * (window.location) when the param looks like the placeholder. On the web build
 * (and during SSR) it just trusts the value Next provides.
 *
 * Pair this with the SPA fallback in scripts/cap-build.mjs, which makes any
 * unmatched dynamic path serve the right `__id` shell so the router can boot.
 */

/** Placeholder value used for the single pre-rendered shell. */
export const STATIC_EXPORT_PLACEHOLDER = '__id';

/** Capacitor static export (`NEXT_PUBLIC_CAP=1`) — only pre-render the `__id` shell. */
export const IS_CAPACITOR_STATIC_EXPORT = process.env.NEXT_PUBLIC_CAP === '1';

/**
 * Use in page.tsx segment config — must be a literal boolean for Next.js.
 * Web/dev: `export const dynamicParams = true;`
 * Cap export: scripts/cap-build.mjs temporarily rewrites to `false` before build.
 */
export const DYNAMIC_ROUTE_PARAMS_ALLOWED = true;

/** Build a one-element param list for a given dynamic segment key. */
export function staticParam(key: string): Array<Record<string, string>> {
  return [{ [key]: STATIC_EXPORT_PLACEHOLDER }];
}

/** generateStaticParams helper — empty on web, placeholder shell on Cap export. */
export function capStaticParams(key: string): Array<Record<string, string>> {
  return IS_CAPACITOR_STATIC_EXPORT ? staticParam(key) : [];
}

/**
 * Resolve a dynamic route param to its real runtime value.
 *
 * @param paramFromHook  the value Next's useParams() returned for this segment
 * @param segmentIndexFromEnd
 *        which path segment holds this param, counted from the END of the path.
 *        e.g. for /profile/[username]            -> 0 (last segment)
 *             for /profile/[username]/followers  -> 1 (second-to-last)
 *             for /events/[id]/edit              -> 1
 */
export function resolveDynamicParam(
  paramFromHook: string | string[] | undefined,
  segmentIndexFromEnd = 0,
): string {
  const hookValue = Array.isArray(paramFromHook) ? paramFromHook[0] : paramFromHook;

  // On the server, or when Next already gave us a real value, trust it.
  if (typeof window === 'undefined') return hookValue ?? '';
  if (hookValue && hookValue !== STATIC_EXPORT_PLACEHOLDER) return hookValue;

  // Placeholder (or missing) -> read the real segment from the URL.
  try {
    const path = window.location.pathname.replace(/\/+$/, ''); // drop trailing slash
    const segments = path.split('/').filter(Boolean);
    const idx = segments.length - 1 - segmentIndexFromEnd;
    const fromUrl = idx >= 0 ? segments[idx] : undefined;
    if (fromUrl && fromUrl !== STATIC_EXPORT_PLACEHOLDER) {
      return decodeURIComponent(fromUrl);
    }
  } catch {
    /* fall through */
  }
  return hookValue ?? '';
}
