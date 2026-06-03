const STORAGE_HREF = 'neyborhuud_sentinel_back_href';
const STORAGE_LABEL = 'neyborhuud_sentinel_back_label';

export type SentinelBackTarget = {
  href: string;
  label: string;
};

const DEFAULT_BACK: SentinelBackTarget = {
  href: '/safety',
  label: 'Sentinel AI hub',
};

/** Short label for common Sentinel / app routes */
export function labelForSentinelPath(pathname: string): string {
  const base = pathname.split('?')[0] ?? pathname;
  const labels: Record<string, string> = {
    '/safety': 'Sentinel AI hub',
    '/safety/manage': 'Dashboard',
    '/safety/trips': 'Safe trips',
    '/safety/kidnapping-tracking': 'Live tracking',
    '/sos': 'SOS',
    '/': 'Home',
    '/feed': 'Feed',
    '/gamification': 'Huud Economy',
    '/huud-economy': 'Huud Economy',
  };
  return labels[base] ?? 'Back';
}

export function rememberSentinelBack(fromPath: string, label?: string): void {
  if (typeof window === 'undefined') return;
  const href = fromPath.split('?')[0] || '/safety';
  if (!href.startsWith('/')) return;
  sessionStorage.setItem(STORAGE_HREF, href);
  sessionStorage.setItem(STORAGE_LABEL, label ?? labelForSentinelPath(href));
}

export function applySentinelBackFromQuery(search: string): void {
  if (typeof window === 'undefined') return;
  const from = new URLSearchParams(search).get('from');
  if (from && from.startsWith('/')) {
    rememberSentinelBack(from);
  }
}

/** Use referrer when nothing was stored explicitly (e.g. sidebar link). */
export function captureSentinelReferrerIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(STORAGE_HREF)) return;

  try {
    const ref = document.referrer;
    if (!ref) return;
    const refUrl = new URL(ref);
    if (refUrl.origin !== window.location.origin) return;

    const path = refUrl.pathname + refUrl.hash;
    if (path === window.location.pathname + window.location.hash) return;

    rememberSentinelBack(path);
  } catch {
    // ignore invalid referrer
  }
}

export function getSentinelBack(): SentinelBackTarget {
  if (typeof window === 'undefined') return DEFAULT_BACK;

  const href = sessionStorage.getItem(STORAGE_HREF);
  const label = sessionStorage.getItem(STORAGE_LABEL);
  if (href?.startsWith('/')) {
    return { href, label: label || labelForSentinelPath(href) };
  }
  return DEFAULT_BACK;
}

export function appendSentinelFromParam(href: string, fromPath: string): string {
  const [path, hash = ''] = href.split('#');
  const sep = path.includes('?') ? '&' : '?';
  const next = `${path}${sep}from=${encodeURIComponent(fromPath)}${hash ? `#${hash}` : ''}`;
  return next;
}
