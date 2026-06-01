import { routeUsesBrowseShell } from '@/lib/browseShellRoutes';

/**
 * App routes that mount their own TopNav (page shell, AppBrowseLayout, or GlassFormPage).
 * The root layout must not also render AutoTopNav on these paths.
 */
export const PAGE_OWNED_TOP_NAV_PREFIXES = [
  '/feed',
  '/friendship',
  '/safety',
  '/explore',
  '/marketplace',
  '/jobs',
  '/events',
  '/services',
  '/sos',
  '/settings',
  '/notifications',
  '/incident-reports',
  '/help-request',
  '/community-emergency',
  '/premium',
  '/fyi',
  '/info',
  '/chat',
] as const;

function normalizePath(pathname: string): string {
  return pathname.split('?')[0].split('#')[0];
}

export function routeHasPageOwnedTopNav(pathname: string): boolean {
  const path = normalizePath(pathname);

  if (routeUsesBrowseShell(path)) return true;
  if (path === '/') return false;

  if (
    PAGE_OWNED_TOP_NAV_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  // Chat thread uses a custom back + title bar (not global TopNav)
  if (path.startsWith('/chat/')) return true;

  return false;
}

/** True when the root layout should render the global AutoTopNav. */
export function shouldRenderGlobalTopNav(pathname: string): boolean {
  return !routeHasPageOwnedTopNav(pathname);
}

/**
 * Routes with a desktop sidebar in the page shell — skip global mobile drawer duplicate.
 */
export function routeHasPageOwnedSidebar(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === '/' || path === '/feed' || routeUsesBrowseShell(path)) return true;
  if (path.startsWith('/safety')) return true;
  if (path === '/events/create' || path === '/marketplace/create') return true;
  if (/^\/marketplace\/[^/]+\/edit$/.test(path)) return true;
  if (path.startsWith('/chat/')) return true;
  return false;
}

export function shouldRenderGlobalLeftSidebar(pathname: string): boolean {
  return !routeHasPageOwnedSidebar(pathname);
}
