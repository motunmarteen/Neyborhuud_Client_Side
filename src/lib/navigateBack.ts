type AppRouter = {
  back: () => void;
  push: (href: string) => void;
};

/** Route fallbacks when there is no browser history to pop. */
const PREFIX_FALLBACKS: Array<[prefix: string, href: string]> = [
  ['/settings', '/feed'],
  ['/profile', '/feed'],
  ['/marketplace', '/marketplace'],
  ['/events', '/events'],
  ['/jobs', '/jobs'],
  ['/services', '/services'],
  ['/messages', '/chat'],
  ['/chat', '/chat'],
  ['/safety', '/feed'],
  ['/sos', '/feed'],
  ['/help-request', '/help-request'],
  ['/local-news', '/local-news'],
  ['/gamification', '/gamification'],
  ['/admin', '/feed'],
  ['/incident-reports', '/incident-reports'],
  ['/explore', '/feed'],
  ['/notifications', '/feed'],
  ['/communities', '/feed'],
  ['/neighborhood', '/feed'],
  ['/popular', '/neighborhood'],
  ['/gossip', '/local-news?tab=huud-gist'],
];

export function resolveBackFallback(pathname: string): string {
  for (const [prefix, href] of PREFIX_FALLBACKS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return href;
    }
  }
  return '/feed';
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
