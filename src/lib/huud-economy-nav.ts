export type HuudEconomySectionId = 'overview' | 'score' | 'wallet' | 'trust';

export const HUUD_ECONOMY_SECTIONS: {
  id: HuudEconomySectionId;
  label: string;
  href: string;
  icon: string;
}[] = [
  { id: 'overview', label: 'Overview', href: '/huud-economy', icon: 'dashboard' },
  { id: 'score', label: 'Huud Score', href: '/huud-economy/score', icon: 'military_tech' },
  { id: 'wallet', label: 'Huud Wallet', href: '/huud-economy/wallet', icon: 'account_balance_wallet' },
  {
    id: 'trust',
    label: 'TrustOS',
    href: '/huud-economy/score?tab=trustos',
    icon: 'verified_user',
  },
];

export function resolveHuudEconomySection(
  pathname: string,
  tab: string | null,
): HuudEconomySectionId {
  const path = pathname.split('?')[0];
  if (path === '/huud-economy' || path === '/huud-economy/') return 'overview';
  if (path.startsWith('/huud-economy/wallet')) return 'wallet';
  if (path.startsWith('/huud-economy/score') && tab === 'trustos') return 'trust';
  if (path.startsWith('/huud-economy/score')) return 'score';
  if (path.startsWith('/gamification/wallet')) return 'wallet';
  if (path.startsWith('/gamification') && tab === 'trustos') return 'trust';
  if (path.startsWith('/gamification')) return 'score';
  return 'overview';
}
