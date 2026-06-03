/** Routes that mount `AppBrowseLayout` (own TopNav + LeftSidebar + BottomNav). */
export const BROWSE_SHELL_ROUTE_PREFIXES = [
  '/profile',
  '/gamification',
  '/huud-economy',
  '/local-news',
  '/neighborhood',
  '/saved',
  '/communities',
  '/chat',
  '/safety',
  '/sos',
  '/marketplace',
  '/jobs',
  '/services',
  '/events',
  '/fyi',
  '/help-request',
  '/incident-reports',
  '/community-emergency',
] as const;

export function routeUsesBrowseShell(pathname: string): boolean {
  const path = pathname.split('?')[0].split('#')[0];
  return BROWSE_SHELL_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
