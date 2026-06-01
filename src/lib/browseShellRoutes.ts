/** Routes that mount `AppBrowseLayout` (own TopNav + LeftSidebar + BottomNav). */
export const BROWSE_SHELL_ROUTE_PREFIXES = [
  '/profile',
  '/gamification',
  '/local-news',
  '/neighborhood',
  '/saved',
  '/communities',
] as const;

export function routeUsesBrowseShell(pathname: string): boolean {
  const path = pathname.split('?')[0].split('#')[0];
  return BROWSE_SHELL_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
