type AppRouter = {
  back: () => void;
  push: (href: string) => void;
};

/** Route fallbacks when there is no browser history to pop. */
const PREFIX_FALLBACKS: Array<[prefix: string, href: string]> = [
  ['/settings', '/huud'],
  ['/profile', '/huud'],
  ['/marketplace', '/marketplace'],
  ['/events', '/events'],
  ['/jobs', '/jobs'],
  ['/services', '/services'],
  ['/messages', '/chat'],
  ['/chat', '/chat'],
  ['/safety', '/huud'],
  ['/sos', '/huud'],
  ['/help-request', '/help-request'],
  ['/local-news', '/local-news'],
  ['/gamification', '/huud-economy'],
  ['/huud-economy', '/huud-economy'],
  ['/ads/new', '/ads'],
  ['/ads/wall', '/ads'],
  ['/ads/mine', '/ads'],
  ['/ads', '/huud'],
  ['/admin', '/huud'],
  ['/incident-reports', '/incident-reports'],
  ['/explore', '/feed'],
  ['/sentinel', '/huud'],
  ['/lost-found', '/feed'],
  ['/notifications', '/huud'],
  ['/communities', '/huud'],
  ['/neighborhood', '/huud'],
  ['/popular', '/feed'],
  ['/gossip', '/feed'],
  ['/gist', '/feed'],
];

export function resolveBackFallback(pathname: string): string {
  for (const [prefix, href] of PREFIX_FALLBACKS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return href;
    }
  }
  // Home is the map (owner 2026-10-18).
  return '/huud';
}

export function canPopHistory(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

export function navigateBack(
  router: AppRouter,
  options?: { fallback?: string; pathname?: string },
): void {
  const pathname =
    options?.pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '/feed');
  const fallback = options?.fallback ?? resolveBackFallback(pathname);

  if (canPopHistory()) {
    router.back();
    return;
  }
  router.push(fallback);
}
