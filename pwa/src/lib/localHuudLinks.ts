import type { LucideIcon } from 'lucide-react';
import {
  Megaphone,
  HelpCircle,
  Briefcase,
  Calendar,
  ShoppingBag,
  FileWarning,
  ShieldAlert,
  Building2,
} from 'lucide-react';

/** Community utilities grouped under one “Local Huud” menu (sidebar + explore). */
export const LOCAL_HUUD_MENU = {
  id: 'local-huud',
  label: 'Local Huud',
  Icon: Building2,
  description: '7 services in your Huud',
} as const;

export type LocalHuudLink = {
  Icon: LucideIcon;
  label: string;
  type: string;
  href: string;
};

export const LOCAL_HUUD_LINKS: LocalHuudLink[] = [
  { Icon: Megaphone, label: 'FYI Bulletins', type: 'fyi', href: '/fyi' },
  { Icon: HelpCircle, label: 'Help Requests', type: 'help_request', href: '/help-request' },
  { Icon: Briefcase, label: 'Work & Gigs', type: 'job', href: '/work' },
  { Icon: Calendar, label: 'Events', type: 'event', href: '/events' },
  { Icon: ShoppingBag, label: 'Marketplace', type: 'marketplace', href: '/marketplace' },
  { Icon: FileWarning, label: 'Incident Reports', type: 'incident', href: '/incident-reports' },
  { Icon: ShieldAlert, label: 'Community Alerts', type: 'emergency', href: '/community-emergency' },
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
