/** Community utilities grouped under one “Local Huud” menu (sidebar + explore). */
export const LOCAL_HUUD_MENU = {
  id: 'local-huud',
  label: 'Local Huud',
  icon: 'domain',
  description: '8 services in your Huud',
} as const;

export type LocalHuudLink = {
  icon: string;
  label: string;
  type: string;
  href: string;
};

export const LOCAL_HUUD_LINKS: LocalHuudLink[] = [
  { icon: 'campaign', label: 'FYI Bulletins', type: 'fyi', href: '/fyi' },
  { icon: 'help', label: 'Help Requests', type: 'help_request', href: '/help-request' },
  { icon: 'work', label: 'Jobs', type: 'job', href: '/jobs' },
  { icon: 'event', label: 'Events', type: 'event', href: '/events' },
  { icon: 'shopping_bag', label: 'Marketplace', type: 'marketplace', href: '/marketplace' },
  { icon: 'handyman', label: 'Services', type: 'services', href: '/services' },
  { icon: 'report', label: 'Incident Reports', type: 'incident', href: '/incident-reports' },
  { icon: 'add_alert', label: 'Community Alerts', type: 'emergency', href: '/community-emergency' },
];

export function isLocalHuudPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return LOCAL_HUUD_LINKS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function getLocalHuudLinkForPath(pathname: string | null | undefined): LocalHuudLink | null {
  if (!pathname) return null;
  return (
    LOCAL_HUUD_LINKS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? null
  );
}
